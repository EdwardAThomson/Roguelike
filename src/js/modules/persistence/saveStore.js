// SaveStore: the storage adapter contract every backend implements.
//
// Implementations: InMemorySaveStore (below, used by unit tests),
// IndexedDBSaveStore (browser, indexedDBSaveStore.js) and, in a later phase,
// CloudSaveStore (Octonion gateway). SaveManager only ever talks to this
// interface, so storage backends are swappable and unit tests never need a
// browser.
//
// Contract (all methods async):
//   list()                                   -> [{ slot, meta, savedAt }]
//   load(slot)                               -> envelope | null
//   save(slot, envelope, { expectedGeneration } = {}) -> { generation }
//   delete(slot)                             -> void
//   isAvailable()                            -> boolean
//
// generation is an optimistic-concurrency counter matching the cloud
// contract; local stores just increment it so SaveManager can carry it
// through to cloud sync later.

export class InMemorySaveStore {
    constructor() {
        this.slots = new Map();
        this.generations = new Map();
    }

    async isAvailable() {
        return true;
    }

    async list() {
        return [...this.slots.entries()].map(([slot, envelope]) => ({
            slot,
            meta: envelope.meta,
            savedAt: envelope.savedAt
        }));
    }

    async load(slot) {
        return this.slots.has(slot) ? this.slots.get(slot) : null;
    }

    async save(slot, envelope, { expectedGeneration } = {}) {
        const current = this.generations.get(slot) ?? 0;
        if (expectedGeneration != null && expectedGeneration !== current) {
            const error = new Error('save generation conflict');
            error.code = 'conflict';
            error.current = this.slots.get(slot) ?? null;
            throw error;
        }
        // Store a JSON copy so later mutations of the live envelope cannot
        // reach into the "persisted" one (matches real storage semantics).
        this.slots.set(slot, JSON.parse(JSON.stringify(envelope)));
        const generation = current + 1;
        this.generations.set(slot, generation);
        return { generation };
    }

    async delete(slot) {
        this.slots.delete(slot);
        this.generations.delete(slot);
    }
}
