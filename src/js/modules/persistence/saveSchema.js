// Save format definitions shared by the serializer, hydrator and save stores.
//
// A save is an "envelope": { formatVersion, game, savedAt, reason, meta, state }.
// - formatVersion guards structural changes to the save layout itself.
// - game is Version.getVersionInfo() (content version) for future migrations.
// - meta is a small summary for menu display (never needed to load the game).
// - state is the full serialized game produced by serializer.js.
//
// Deliberately NOT saved (transient, rebuilt on load): in-flight projectiles,
// FOV visible set, camera position, move/attack timers, and (v1) all status
// effects. StatusEffectManager keys its Map by live object reference, so
// persisting effects needs an entity-indexing scheme; revisit if effects ever
// outlast a few turns.

import { Version } from '../../version.js';

export const FORMAT_VERSION = 1;

// Single suspend-save slot. The store interface supports arbitrary slots so a
// multi-slot UI (or cloud slot list) can arrive later without a format change.
export const SAVE_SLOT = 0;

// Tile rows are stored as compact strings, one character per tile. A full
// 80x40 section is ~3.3KB instead of ~35KB of JSON string arrays, which keeps
// multi-section saves far under the cloud gateway's 2MB PUT limit.
const TILE_TO_CHAR = { wall: 'w', floor: 'f', gate: 'g' };
const CHAR_TO_TILE = { w: 'wall', f: 'floor', g: 'gate' };

export function encodeTiles(tiles) {
    return tiles.map(row => row.map(tile => TILE_TO_CHAR[tile] ?? 'w').join(''));
}

export function decodeTiles(rows) {
    return rows.map(row => [...row].map(ch => CHAR_TO_TILE[ch] ?? 'wall'));
}

// Menu-facing summary, mirrors the shape of the cloud slot_metadata columns.
export function buildMeta(game) {
    return {
        playerName: game.player ? game.player.name : 'Player',
        playerLevel: game.player ? game.player.level : 1,
        currentSectionId: game.worldManager ? game.worldManager.currentSectionId : '0_0',
        gold: game.player && game.player.inventory ? game.player.inventory.gold : 0,
        hardcore: !!game.hardcore
    };
}

export function buildEnvelope(state, meta, reason = 'manual') {
    return {
        formatVersion: FORMAT_VERSION,
        game: Version.getVersionInfo(),
        savedAt: new Date().toISOString(),
        reason,
        meta,
        state
    };
}

// A save we can attempt to restore. Older/newer formatVersions are rejected
// (there is only v1 today); the caller decides how to message the player.
export function isCompatibleEnvelope(envelope) {
    return !!envelope
        && envelope.formatVersion === FORMAT_VERSION
        && !!envelope.state
        && !!envelope.state.player
        && !!envelope.state.world
        && !!envelope.state.sections;
}
