// SaveManager: the game-facing orchestrator for persistence. Owns every
// save/load policy decision (single suspend slot, autosave on section
// transitions, permadeath deletion) so gameplay code only ever calls into
// this class with one-liners. Storage is behind the injected SaveStore
// adapter (saveStore.js), so this class is unit-testable with the in-memory
// store and cloud-ready later without changes at the call sites.

import { SAVE_SLOT, buildEnvelope, buildMeta, isCompatibleEnvelope } from './saveSchema.js';
import { serializeGame } from './serializer.js';
import { restoreGame } from './hydrator.js';

export class SaveManager {
    /**
     * @param store  Primary SaveStore: the local source of truth (IndexedDB
     *               in the browser, in-memory in tests).
     * @param cloud  Optional cloud SaveStore mirror. Local-first policy:
     *               gameplay only ever waits on the local write; the cloud
     *               push runs behind it and degrades silently when signed
     *               out, unconfigured or unreachable.
     */
    constructor(game, store, cloud = null) {
        this.game = game;
        this.store = store;
        this.cloud = cloud;
        // Serialize writes behind a single chain so an autosave and a manual
        // save can never interleave their store operations.
        this.writeChain = Promise.resolve();
        // Last-known store generation, carried for cloud optimistic
        // concurrency in the cloud-sync phase.
        this.generation = null;
        // Last generation the cloud acknowledged (optimistic concurrency).
        this.cloudGeneration = null;
        // Cloud pushes chain here; gameplay never awaits it, tests can.
        this.cloudChain = Promise.resolve();
        // Only nag about a broken cloud once per session.
        this.cloudWarned = false;
    }

    message(text, color) {
        if (this.game.ui && typeof this.game.ui.addMessage === 'function') {
            this.game.ui.addMessage(text, color);
        }
    }

    /**
     * Serialize and persist the current game. Returns true on success.
     * Gated on the playing state: saving from the game-over screen (or any
     * future menu state) would capture a dead or inconsistent world.
     */
    async saveGame(reason = 'manual') {
        if (!this.game.stateManager || !this.game.stateManager.isPlaying() || !this.game.player) {
            return false;
        }

        // Snapshot synchronously so the world can't mutate between the
        // request and the write.
        let envelope;
        try {
            envelope = buildEnvelope(serializeGame(this.game), buildMeta(this.game), reason);
        } catch (error) {
            console.error('💾 Save serialization failed:', error);
            this.message('Save failed!', '#f55');
            return false;
        }

        const write = this.writeChain.then(async () => {
            const { generation } = await this.store.save(SAVE_SLOT, envelope);
            this.generation = generation;
        });
        // Keep the chain alive even after a failed write.
        this.writeChain = write.catch(() => {});

        try {
            await write;
            if (reason === 'manual') {
                this.message('Game saved.', '#0f0');
            } else {
                this.message('Autosaved.', '#888');
            }
            // Mirror to the cloud AFTER the local write succeeded; never
            // blocks gameplay, never fails the local save.
            this.pushToCloud(envelope);
            return true;
        } catch (error) {
            console.error('💾 Save failed:', error);
            this.message('Save failed! Progress is not being stored.', '#f55');
            return false;
        }
    }

    /**
     * Fire-and-forget cloud mirror. Optimistic concurrency: send the last
     * generation the cloud acknowledged; on a 409 (another device wrote in
     * between) resolve last-write-wins in favor of this just-created save by
     * retrying against the server's current generation. Any availability
     * problem degrades to local-only with a single quiet notice.
     */
    pushToCloud(envelope) {
        if (!this.cloud) return;
        this.cloudChain = this.cloudChain.then(async () => {
            try {
                const { generation } = await this.cloud.save(SAVE_SLOT, envelope, {
                    expectedGeneration: this.cloudGeneration ?? undefined
                });
                this.cloudGeneration = generation;
            } catch (error) {
                if (error.code === 'conflict') {
                    try {
                        const currentGeneration = error.current?.generation ?? undefined;
                        const { generation } = await this.cloud.save(SAVE_SLOT, envelope, {
                            expectedGeneration: currentGeneration
                        });
                        this.cloudGeneration = generation;
                        this.message('Cloud save overwrote progress from another device.', '#888');
                        return;
                    } catch (retryError) {
                        error = retryError;
                    }
                }
                if (error.code === 'auth' || error.code === 'unavailable' || error.code === 'network') {
                    if (!this.cloudWarned) {
                        this.cloudWarned = true;
                        this.message('Cloud sync unavailable, saving locally only.', '#888');
                    }
                } else {
                    console.error('☁️ Cloud save push failed:', error);
                }
            }
        });
    }

    // Fire-and-forget wrapper for gameplay hooks (section transitions).
    autosave() {
        this.saveGame('autosave').catch(error => {
            console.error('💾 Autosave failed:', error);
        });
    }

    // Fetch the stored envelope, or null when there is no (readable) save.
    async loadEnvelope() {
        try {
            return await this.store.load(SAVE_SLOT);
        } catch (error) {
            console.error('💾 Could not read save:', error);
            return null;
        }
    }

    /**
     * Restore an envelope onto the game. Returns false (leaving the caller
     * to start a new game) on incompatible or corrupt saves; never deletes
     * the blob, so a future version with migrations could still rescue it.
     */
    restore(envelope) {
        if (!isCompatibleEnvelope(envelope)) {
            console.warn('💾 Incompatible or corrupt save, starting fresh. formatVersion:', envelope?.formatVersion);
            return false;
        }
        try {
            return restoreGame(this.game, envelope.state);
        } catch (error) {
            console.error('💾 Save restore failed:', error);
            return false;
        }
    }

    /**
     * Death policy, the single place it lives. The mode is chosen at run
     * start and immutable after (game.hardcore, persisted in the save):
     *  - hardcore: permadeath, the run's save is deleted locally and in the
     *    cloud;
     *  - softcore: the save survives, so the player can Continue from the
     *    last save or autosave via the menu.
     */
    onPlayerDeath() {
        if (!this.game.hardcore) {
            return;
        }
        const deletion = this.writeChain.then(() => this.store.delete(SAVE_SLOT));
        this.writeChain = deletion.catch(() => {});
        deletion.catch(error => {
            console.error('💾 Could not delete save on death:', error);
        });
        if (this.cloud) {
            this.cloud.delete(SAVE_SLOT).then(() => {
                this.cloudGeneration = null;
            }).catch(error => {
                console.error('☁️ Could not delete cloud save on death:', error);
            });
        }
    }
}
