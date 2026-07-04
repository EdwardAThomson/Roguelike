// Cloud implementation of the SaveStore contract (see saveStore.js), talking
// to a per-game Octonion saves gateway that follows the RPG-Loom contract:
//
//   GET    /api/saves            -> { saves: [{ slot, generation, updatedAt, ... }] }
//   GET    /api/saves/:slot      -> { save: { state, generation, updatedAt, ... } } | 404
//   PUT    /api/saves/:slot      body { engineVersion, contentVersion, state,
//                                       expectedGeneration? } (2MB limit)
//                                -> { save } | 409 { error:'conflict', current }
//   DELETE /api/saves/:slot      -> { ok: true } | 404
//
// The stored `state` is the entire local save envelope, so meta survives the
// round trip. A 503 (gateway up but unconfigured) or network failure marks
// the store unavailable; SaveManager degrades to local-only.

import { CONFIG, cloudConfigured } from '../../config.js';
import { FORMAT_VERSION } from './saveSchema.js';
import { authClient } from './authClient.js';

function cloudError(message, code, extra = {}) {
    const error = new Error(message);
    error.code = code;
    Object.assign(error, extra);
    return error;
}

export class CloudSaveStore {
    async request(path, { method = 'GET', body } = {}) {
        const token = await authClient.getAccessToken();
        if (!token) {
            throw cloudError('Not signed in', 'auth');
        }

        let resp;
        try {
            resp = await fetch(`${CONFIG.GATEWAY_URL}${path}`, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...(body ? { 'Content-Type': 'application/json' } : {})
                },
                body: body ? JSON.stringify(body) : undefined
            });
        } catch (error) {
            throw cloudError('Cloud saves unreachable', 'network', { cause: error });
        }

        if (resp.status === 503) {
            throw cloudError('Cloud saves unavailable', 'unavailable');
        }
        if (resp.status === 401 || resp.status === 403) {
            throw cloudError('Cloud save authorization failed', 'auth');
        }
        if (resp.status === 409) {
            const data = await resp.json().catch(() => ({}));
            throw cloudError('Cloud save generation conflict', 'conflict', { current: data.current ?? null });
        }
        if (resp.status === 404) {
            return null;
        }
        if (!resp.ok) {
            throw cloudError(`Cloud save request failed (${resp.status})`, 'server');
        }
        return resp.json();
    }

    // Available means: configured, signed in, and the gateway answers.
    async isAvailable() {
        if (!cloudConfigured()) return false;
        try {
            if (!(await authClient.getUser())) return false;
            await this.request('/api/saves');
            return true;
        } catch {
            return false;
        }
    }

    async list() {
        const data = await this.request('/api/saves');
        return (data?.saves ?? []).map(row => ({
            slot: row.slot,
            meta: null, // slot metadata lives server-side; envelope meta comes with load()
            savedAt: row.updatedAt,
            generation: row.generation
        }));
    }

    async load(slot) {
        const data = await this.request(`/api/saves/${slot}`);
        return data ? data.save.state : null;
    }

    async save(slot, envelope, { expectedGeneration } = {}) {
        const data = await this.request(`/api/saves/${slot}`, {
            method: 'PUT',
            body: {
                engineVersion: FORMAT_VERSION,
                contentVersion: envelope.game.version,
                state: envelope,
                ...(expectedGeneration != null ? { expectedGeneration } : {})
            }
        });
        return { generation: data.save.generation };
    }

    async delete(slot) {
        await this.request(`/api/saves/${slot}`, { method: 'DELETE' });
    }
}
