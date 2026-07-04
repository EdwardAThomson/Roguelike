// IndexedDB implementation of the SaveStore contract (see saveStore.js).
// One database, one object store keyed by slot number. All IndexedDB
// callbacks are wrapped into promises; failures surface as typed errors so
// SaveManager can message the player instead of crashing the game.

const DB_NAME = 'newroguelike';
const DB_VERSION = 1;
const STORE_NAME = 'saves';

function storageError(message, cause) {
    const error = new Error(message);
    error.code = 'storage';
    error.cause = cause;
    return error;
}

export class IndexedDBSaveStore {
    constructor() {
        this.dbPromise = null;
    }

    // Feature-detect without throwing: private browsing modes and some
    // embedded contexts expose indexedDB but reject open().
    async isAvailable() {
        if (typeof indexedDB === 'undefined') return false;
        try {
            await this.openDB();
            return true;
        } catch {
            return false;
        }
    }

    openDB() {
        if (!this.dbPromise) {
            this.dbPromise = new Promise((resolve, reject) => {
                if (typeof indexedDB === 'undefined') {
                    reject(storageError('IndexedDB is not available'));
                    return;
                }
                const request = indexedDB.open(DB_NAME, DB_VERSION);
                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        db.createObjectStore(STORE_NAME);
                    }
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => {
                    this.dbPromise = null; // allow a later retry
                    reject(storageError('Could not open the save database', request.error));
                };
                request.onblocked = () => {
                    this.dbPromise = null;
                    reject(storageError('Save database is blocked by another tab'));
                };
            });
        }
        return this.dbPromise;
    }

    async transaction(mode, run) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, mode);
            const store = tx.objectStore(STORE_NAME);
            const request = run(store);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(storageError('Save storage operation failed', request.error));
        });
    }

    async list() {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const keysReq = store.getAllKeys();
            const valuesReq = store.getAll();
            tx.oncomplete = () => {
                const entries = keysReq.result.map((slot, i) => {
                    const record = valuesReq.result[i];
                    return {
                        slot,
                        meta: record?.envelope?.meta ?? null,
                        savedAt: record?.envelope?.savedAt ?? null
                    };
                });
                resolve(entries);
            };
            tx.onerror = () => reject(storageError('Could not list saves', tx.error));
        });
    }

    async load(slot) {
        const record = await this.transaction('readonly', store => store.get(slot));
        return record ? record.envelope : null;
    }

    async save(slot, envelope, { expectedGeneration } = {}) {
        const existing = await this.transaction('readonly', store => store.get(slot));
        const current = existing?.generation ?? 0;
        if (expectedGeneration != null && expectedGeneration !== current) {
            const error = new Error('save generation conflict');
            error.code = 'conflict';
            error.current = existing?.envelope ?? null;
            throw error;
        }
        const generation = current + 1;
        await this.transaction('readwrite', store => store.put({ envelope, generation }, slot));
        return { generation };
    }

    async delete(slot) {
        await this.transaction('readwrite', store => store.delete(slot));
    }
}
