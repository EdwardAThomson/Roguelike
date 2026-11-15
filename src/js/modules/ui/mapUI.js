// MapUI: the Map tab of the game modal (M). Two modes on one canvas:
//
//   Area   the section you are viewing (default: the one you are in), fitted
//          to the frame from what you have explored, with gates, where they
//          lead, and the monsters / items currently in view.
//   World  every visited section on the world grid (north up), each drawn as
//          a pixel thumbnail of its explored tiles, plus dashed outlines for
//          the unvisited neighbours. The world is pseudo-infinite, so this
//          view pans (arrows / WASD / drag), zooms (+ / - / wheel), recenters
//          (Space) and fits everything known (F). Zoomed far out, thumbnails
//          collapse to theme-coloured blocks. Clicking a section opens it in
//          Area mode.
//
// 1 / 2 / Tab switch modes. Implements the GameModal provider interface
// (mountPanel / onShow / onHide / handleKey). All the reading of game state
// lives in worldMapModel.js; this file only draws and handles input.

import {
    buildWorldMapModel,
    getSectionSnapshot,
    describeGates,
    isExplored,
    mapThemeColors,
    parseSectionId
} from './worldMapModel.js';

// World view zoom steps, in screen pixels per dungeon tile.
const ZOOM_STEPS = [0.25, 0.5, 1, 2, 3, 4];
const DEFAULT_ZOOM_INDEX = 3;
const DRAG_THRESHOLD = 4;

const GATE_COLOR = '#daa520';
const GATE_COLOR_DIM = '#8a6d1c';
const PLAYER_COLOR = '#ffd34d';
const BACKGROUND = '#0a0a0f';
const NODE_BACKGROUND = '#111118';

const ARROWS = { north: '↑', south: '↓', east: '→', west: '←' };

export class MapUI {
    constructor(game) {
        this.game = game;
        this.mode = 'area';
        this.visible = false;
        this.areaSectionId = null;   // null = follow the current section
        this.camX = 0;               // world view centre, in section units
        this.camY = 0;
        this.zoomIndex = DEFAULT_ZOOM_INDEX;
        this.thumbnails = new Map(); // sectionId -> { key, canvas }
        this.layout = null;          // last world layout, for hit testing
        this.drag = null;
    }

    mountPanel(panel) {
        this.panel = panel;
        panel.classList.add('wm-panel');

        const header = document.createElement('div');
        header.className = 'wm-header';

        this.modeButtons = {};
        for (const [mode, label] of [['area', 'Area'], ['world', 'World']]) {
            const button = document.createElement('button');
            button.className = 'wm-mode';
            button.dataset.mode = mode;
            button.innerHTML = `${label} <span class="wm-key">${mode === 'area' ? '1' : '2'}</span>`;
            button.addEventListener('click', () => this.setMode(mode));
            header.appendChild(button);
            this.modeButtons[mode] = button;
        }

        this.titleEl = document.createElement('div');
        this.titleEl.className = 'wm-title';
        header.appendChild(this.titleEl);

        this.hintEl = document.createElement('div');
        this.hintEl.className = 'wm-hint';
        header.appendChild(this.hintEl);
        panel.appendChild(header);

        this.wrap = document.createElement('div');
        this.wrap.className = 'wm-canvas-wrap';
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'wm-canvas';
        this.wrap.appendChild(this.canvas);
        panel.appendChild(this.wrap);

        this.footerEl = document.createElement('div');
        this.footerEl.className = 'wm-footer';
        panel.appendChild(this.footerEl);

        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        window.addEventListener('resize', () => { if (this.visible) this.render(); });
    }

    onShow() {
        this.visible = true;
        this.areaSectionId = null;
        this.recenter();
        this.setMode(this.mode);
    }

    onHide() {
        this.visible = false;
        this.drag = null;
    }

    setMode(mode) {
        this.mode = mode === 'world' ? 'world' : 'area';
        for (const [m, button] of Object.entries(this.modeButtons || {})) {
            button.classList.toggle('active', m === this.mode);
        }
        if (this.canvas) {
            this.canvas.style.cursor = this.mode === 'world' ? 'grab' : 'default';
        }
        this.render();
    }

    currentSectionId() {
        return this.game.worldManager ? this.game.worldManager.currentSectionId : '0_0';
    }

    recenter() {
        const { x, y } = parseSectionId(this.currentSectionId());
        this.camX = x;
        this.camY = y;
    }

    zoomBy(step) {
        const next = Math.max(0, Math.min(ZOOM_STEPS.length - 1, this.zoomIndex + step));
        if (next !== this.zoomIndex) {
            this.zoomIndex = next;
            this.render();
        }
    }

    // Largest zoom step at which every known section fits, centred on them.
    fitAll() {
        const model = buildWorldMapModel(this.game);
        if (!model.bounds || !this.wrap) return;
        const { minX, maxX, minY, maxY } = model.bounds;
        const w = this.wrap.clientWidth;
        const h = this.wrap.clientHeight;
        const { sectionW, sectionH } = this.sectionSize();
        let index = 0;
        for (let i = ZOOM_STEPS.length - 1; i >= 0; i--) {
            const m = this.worldMetrics(ZOOM_STEPS[i], sectionW, sectionH);
            if ((maxX - minX + 1) * m.pitchX <= w - 24 && (maxY - minY + 1) * m.pitchY <= h - 24) {
                index = i;
                break;
            }
        }
        this.zoomIndex = index;
        this.camX = (minX + maxX) / 2;
        this.camY = (minY + maxY) / 2;
        this.render();
    }

    handleKey(e) {
        const key = e.key;
        if (key === '1') { e.preventDefault(); this.setMode('area'); return; }
        if (key === '2') { e.preventDefault(); this.setMode('world'); return; }
        if (key === 'Tab') {
            e.preventDefault();
            this.setMode(this.mode === 'area' ? 'world' : 'area');
            return;
        }

        if (this.mode === 'area') {
            if (key === ' ') {
                e.preventDefault();
                this.areaSectionId = null;
                this.render();
            }
            return;
        }

        const lower = key.toLowerCase();
        const pans = {
            arrowleft: [-1, 0], a: [-1, 0],
            arrowright: [1, 0], d: [1, 0],
            arrowup: [0, 1], w: [0, 1],
            arrowdown: [0, -1], s: [0, -1]
        };
        if (pans[lower]) {
            e.preventDefault();
            this.camX += pans[lower][0];
            this.camY += pans[lower][1];
            this.render();
        } else if (key === '+' || key === '=') {
            e.preventDefault();
            this.zoomBy(1);
        } else if (key === '-' || key === '_') {
            e.preventDefault();
            this.zoomBy(-1);
        } else if (key === ' ') {
            e.preventDefault();
            this.recenter();
            this.render();
        } else if (lower === 'f') {
            e.preventDefault();
            this.fitAll();
        }
    }

    // ---- mouse (world view) ----------------------------------------------

    onMouseDown(e) {
        if (!this.visible || e.button !== 0) return;
        this.drag = { startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY, moved: false };
    }

    onMouseMove(e) {
        if (!this.drag || this.mode !== 'world' || !this.layout) return;
        if (!this.drag.moved &&
            Math.hypot(e.clientX - this.drag.startX, e.clientY - this.drag.startY) < DRAG_THRESHOLD) {
            return;
        }
        this.drag.moved = true;
        this.canvas.style.cursor = 'grabbing';
        this.camX -= (e.clientX - this.drag.lastX) / this.layout.pitchX;
        this.camY += (e.clientY - this.drag.lastY) / this.layout.pitchY;
        this.drag.lastX = e.clientX;
        this.drag.lastY = e.clientY;
        this.render();
    }

    onMouseUp(e) {
        const drag = this.drag;
        this.drag = null;
        if (!drag || !this.visible) return;
        if (this.mode === 'world') this.canvas.style.cursor = 'grab';
        if (drag.moved || this.mode !== 'world') return;

        // A click on a visited section opens it in Area mode.
        const rect = this.canvas.getBoundingClientRect();
        const hit = this.hitTestWorld(e.clientX - rect.left, e.clientY - rect.top);
        if (hit) {
            this.areaSectionId = hit === this.currentSectionId() ? null : hit;
            this.setMode('area');
        }
    }

    onWheel(e) {
        if (!this.visible || this.mode !== 'world') return;
        e.preventDefault();
        this.zoomBy(e.deltaY < 0 ? 1 : -1);
    }

    // ---- rendering --------------------------------------------------------

    // Size the backing store to the element (crisp on HiDPI) and return a
    // context in CSS pixels.
    prepareCanvas() {
        const w = Math.max(1, this.wrap.clientWidth);
        const h = Math.max(1, this.wrap.clientHeight);
        const dpr = window.devicePixelRatio || 1;
        if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
            this.canvas.width = Math.round(w * dpr);
            this.canvas.height = Math.round(h * dpr);
            this.canvas.style.width = `${w}px`;
            this.canvas.style.height = `${h}px`;
        }
        const ctx = this.canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = BACKGROUND;
        ctx.fillRect(0, 0, w, h);
        return { ctx, w, h };
    }

    render() {
        if (!this.visible || !this.canvas) return;
        if (this.mode === 'world') {
            this.renderWorld();
        } else {
            this.renderArea();
        }
    }

    sectionSize() {
        return {
            sectionW: this.game.gridWidth || 80,
            sectionH: this.game.gridHeight || 40
        };
    }

    renderArea() {
        const { ctx, w, h } = this.prepareCanvas();
        const sectionId = this.areaSectionId || this.currentSectionId();
        const snapshot = getSectionSnapshot(this.game, sectionId);
        const isCurrent = !!snapshot && snapshot.isCurrent;

        this.hintEl.textContent = isCurrent
            ? '2 / Tab: world map · Esc: close'
            : 'Space: back to your section · 2 / Tab: world map';

        if (!snapshot || !snapshot.tiles || !snapshot.tiles.length) {
            this.titleEl.textContent = '';
            this.footerEl.textContent = '';
            drawCenteredText(ctx, w, h, 'Nothing mapped here yet.');
            return;
        }

        const colors = mapThemeColors(snapshot.theme);
        const tiles = snapshot.tiles;
        const rows = tiles.length;
        const cols = tiles[0].length;
        const padX = 46;
        const padY = 30;
        const cell = Math.max(2, Math.floor(Math.min((w - padX * 2) / cols, (h - padY * 2) / rows)));
        const offX = Math.floor((w - cell * cols) / 2);
        const offY = Math.floor((h - cell * rows) / 2);

        const visible = isCurrent && this.game.fov ? this.game.fov.visible : new Set();
        const revealed = snapshot.revealed;
        let floorTotal = 0;
        let floorSeen = 0;

        // Terrain. Three-quarter walls like the play view: a wall with floor
        // below shows its lit face, any other wall shows its dark top.
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const tile = tiles[y][x];
                const seen = isExplored(snapshot, x, y);
                if (tile !== 'wall') {
                    floorTotal++;
                    if (seen) floorSeen++;
                }
                if (!seen) continue;

                const px = offX + x * cell;
                const py = offY + y * cell;
                if (tile === 'wall') {
                    const below = y + 1 < rows ? tiles[y + 1][x] : 'wall';
                    ctx.fillStyle = colors.wallDark;
                    ctx.fillRect(px, py, cell, cell);
                    if (below !== 'wall') {
                        ctx.fillStyle = colors.wall;
                        ctx.fillRect(px, py + Math.floor(cell * 0.35), cell, cell - Math.floor(cell * 0.35));
                    }
                } else if (tile === 'gate') {
                    ctx.fillStyle = GATE_COLOR;
                    ctx.fillRect(px, py, cell, cell);
                } else {
                    ctx.fillStyle = colors.floor;
                    ctx.fillRect(px, py, cell, cell);
                    if (cell >= 6) {
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
                        ctx.fillRect(px + cell - 1, py, 1, cell);
                        ctx.fillRect(px, py + cell - 1, cell, 1);
                    }
                }

                // Remembered but not currently in view: dimmed.
                if (!revealed && !visible.has(`${x},${y}`)) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
                    ctx.fillRect(px, py, cell, cell);
                }
            }
        }

        // Gates: arrow + destination just outside the map edge.
        for (const info of describeGates(this.game, snapshot)) {
            if (!info.seen) continue;
            const { gate } = info;
            const cx = offX + gate.x * cell + cell / 2;
            const cy = offY + gate.y * cell + cell / 2;
            const label = info.visited ? `${info.target.x},${info.target.y}` : '?';
            ctx.fillStyle = info.visited ? '#f2e2a8' : GATE_COLOR;
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (info.direction === 'north') {
                ctx.fillText(`${ARROWS.north} ${label}`, cx, offY - 14);
            } else if (info.direction === 'south') {
                ctx.fillText(`${ARROWS.south} ${label}`, cx, offY + rows * cell + 14);
            } else {
                const lx = info.direction === 'east' ? offX + cols * cell + 22 : offX - 22;
                ctx.fillText(ARROWS[info.direction], lx, cy - 8);
                ctx.font = '11px monospace';
                ctx.fillText(label, lx, cy + 8);
            }
        }

        if (isCurrent) {
            this.drawAreaEntities(ctx, offX, offY, cell, visible, revealed);
        }

        const pct = floorTotal ? Math.round((floorSeen / floorTotal) * 100) : 0;
        this.titleEl.textContent = `Section ${snapshot.x}, ${snapshot.y}${isCurrent ? ' (you are here)' : ''}`;
        this.footerEl.innerHTML =
            `<span>${colors.label} · Danger Lv ${snapshot.difficulty} · ${pct}% explored</span>` +
            `<span class="wm-legend"><i style="background:${PLAYER_COLOR}"></i>you` +
            `<i style="background:${GATE_COLOR}"></i>gate` +
            `<i style="background:#e55"></i>monster` +
            `<i style="background:#7cf"></i>item` +
            ` · dim = remembered</span>`;
    }

    drawAreaEntities(ctx, offX, offY, cell, visible, revealed) {
        const inView = (x, y) => revealed || visible.has(`${x},${y}`);
        const dot = Math.max(2, Math.floor(cell * 0.5));

        const items = (this.game.itemManager && this.game.itemManager.itemsOnGround) || [];
        for (const ground of items) {
            if (!inView(ground.x, ground.y)) continue;
            const isKey = ground.item && ground.item.gateId != null;
            ctx.fillStyle = isKey ? GATE_COLOR : '#7cf';
            ctx.fillRect(offX + ground.x * cell + (cell - dot) / 2, offY + ground.y * cell + (cell - dot) / 2, dot, dot);
        }

        for (const monster of this.game.monsters || []) {
            if (monster.health !== undefined && monster.health <= 0) continue;
            if (!inView(monster.x, monster.y)) continue;
            drawDot(ctx, offX + monster.x * cell + cell / 2, offY + monster.y * cell + cell / 2,
                Math.max(2, cell * 0.38), '#e55');
        }

        const player = this.game.player;
        if (player) {
            drawPlayerMarker(ctx, offX + player.x * cell + cell / 2, offY + player.y * cell + cell / 2,
                Math.max(3, cell * 0.55));
        }
    }

    worldMetrics(ppt, sectionW, sectionH) {
        const nodeW = sectionW * ppt;
        const nodeH = sectionH * ppt;
        const gap = Math.max(4, Math.min(24, Math.round(10 * ppt)));
        return { ppt, nodeW, nodeH, gap, pitchX: nodeW + gap, pitchY: nodeH + gap };
    }

    renderWorld() {
        const { ctx, w, h } = this.prepareCanvas();
        const model = buildWorldMapModel(this.game);
        const { sectionW, sectionH } = this.sectionSize();
        const m = this.worldMetrics(ZOOM_STEPS[this.zoomIndex], sectionW, sectionH);

        // Screen top-left of a section's node. North (worldY + 1) is up.
        const nodeX = (wx) => Math.round(w / 2 + (wx - this.camX) * m.pitchX - m.nodeW / 2);
        const nodeY = (wy) => Math.round(h / 2 - (wy - this.camY) * m.pitchY - m.nodeH / 2);
        const onScreen = (sx, sy) => sx + m.nodeW >= 0 && sx <= w && sy + m.nodeH >= 0 && sy <= h;
        this.layout = { ...m, nodeX, nodeY, sections: model.sections };

        this.hintEl.textContent = 'Arrows/WASD or drag: pan · +/− or wheel: zoom · Space: recenter · F: fit all';

        // Frontier: unvisited neighbours, brighter when you have found the way.
        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 1;
        for (const f of model.frontier) {
            const sx = nodeX(f.x);
            const sy = nodeY(f.y);
            if (!onScreen(sx, sy)) continue;
            ctx.strokeStyle = f.seen ? '#6b5a2a' : '#25252f';
            ctx.strokeRect(sx + 0.5, sy + 0.5, m.nodeW - 1, m.nodeH - 1);
            if (f.seen && m.ppt >= 0.5) {
                ctx.fillStyle = '#8a7436';
                ctx.font = `bold ${Math.max(10, Math.round(m.nodeH * 0.3))}px monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('?', sx + m.nodeW / 2, sy + m.nodeH / 2);
            }
        }
        ctx.setLineDash([]);

        // Links between adjacent visited sections, at the gate's position.
        const byId = new Map(model.sections.map(s => [s.id, s]));
        const thickness = Math.max(2, Math.round(m.ppt * 1.5));
        for (const link of model.links) {
            const a = byId.get(link.from);
            const ax = nodeX(a.x);
            const ay = nodeY(a.y);
            ctx.fillStyle = link.gateSeen ? GATE_COLOR_DIM : '#33333f';
            if (link.direction === 'east') {
                const gy = link.gate ? ay + (link.gate.y + 0.5) * m.ppt : ay + m.nodeH / 2;
                ctx.fillRect(ax + m.nodeW, Math.round(gy - thickness / 2), m.gap, thickness);
            } else {
                const gx = link.gate ? ax + (link.gate.x + 0.5) * m.ppt : ax + m.nodeW / 2;
                ctx.fillRect(Math.round(gx - thickness / 2), ay - m.gap, thickness, m.gap);
            }
        }

        // Visited sections.
        for (const s of model.sections) {
            const sx = nodeX(s.x);
            const sy = nodeY(s.y);
            if (!onScreen(sx, sy)) continue;
            const colors = mapThemeColors(s.theme);

            ctx.fillStyle = NODE_BACKGROUND;
            ctx.fillRect(sx, sy, m.nodeW, m.nodeH);
            if (m.ppt < 0.5 || !s.tiles) {
                // Too small for detail: a block in the section's theme.
                ctx.fillStyle = colors.wall;
                ctx.fillRect(sx, sy, m.nodeW, m.nodeH);
            } else {
                ctx.drawImage(this.getThumbnail(s), sx, sy, m.nodeW, m.nodeH);
            }

            ctx.lineWidth = s.isCurrent ? 2 : 1;
            ctx.strokeStyle = s.isCurrent ? PLAYER_COLOR : colors.accent;
            ctx.globalAlpha = s.isCurrent ? 1 : 0.55;
            ctx.strokeRect(sx - 0.5, sy - 0.5, m.nodeW + 1, m.nodeH + 1);
            ctx.globalAlpha = 1;

            if (m.ppt >= 1) {
                ctx.font = '10px monospace';
                ctx.textBaseline = 'top';
                const coords = `${s.x},${s.y}${s.isOrigin ? ' ★' : ''}`;
                const level = `Lv ${s.difficulty}`;
                drawTag(ctx, coords, sx + 2, sy + 2, 'left', s.isOrigin ? PLAYER_COLOR : '#ddd');
                drawTag(ctx, level, sx + m.nodeW - 2, sy + 2, 'right', '#c9b37a');
            } else if (s.isOrigin && m.ppt >= 0.5) {
                ctx.font = '10px monospace';
                ctx.textBaseline = 'top';
                drawTag(ctx, '★', sx + 1, sy + 1, 'left', PLAYER_COLOR);
            }

            if (s.isCurrent && this.game.player) {
                drawPlayerMarker(ctx, sx + (this.game.player.x + 0.5) * m.ppt,
                    sy + (this.game.player.y + 0.5) * m.ppt, Math.max(3, m.ppt * 2));
            }
        }

        // Compass.
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#888';
        ctx.fillText('N', w - 22, 16);
        ctx.fillText('↑', w - 22, 30);

        const current = model.current;
        const furthest = model.sections.reduce((d, s) => Math.max(d, Math.abs(s.x) + Math.abs(s.y)), 0);
        this.titleEl.textContent = 'World';
        this.footerEl.innerHTML =
            `<span>${model.sections.length} section${model.sections.length === 1 ? '' : 's'} explored` +
            (current ? ` · You: ${current.x}, ${current.y}` : '') +
            ` · Furthest from start: ${furthest} · Zoom ×${ZOOM_STEPS[this.zoomIndex]}</span>` +
            `<span class="wm-legend"><i style="background:${PLAYER_COLOR}"></i>you · ★ start` +
            ` · <i class="wm-dashed"></i>unexplored · click a section to view it</span>`;
    }

    hitTestWorld(px, py) {
        if (!this.layout) return null;
        const { nodeX, nodeY, nodeW, nodeH, sections } = this.layout;
        for (const s of sections) {
            const sx = nodeX(s.x);
            const sy = nodeY(s.y);
            if (px >= sx && px < sx + nodeW && py >= sy && py < sy + nodeH) return s.id;
        }
        return null;
    }

    // One pixel per tile of explored terrain, cached until more is explored.
    getThumbnail(snapshot) {
        const key = `${snapshot.explored.size}|${snapshot.revealed}`;
        const cached = this.thumbnails.get(snapshot.id);
        if (cached && cached.key === key && cached.tiles === snapshot.tiles) return cached.canvas;

        const tiles = snapshot.tiles;
        const rows = tiles.length;
        const cols = tiles[0].length;
        const canvas = cached ? cached.canvas : document.createElement('canvas');
        canvas.width = cols;
        canvas.height = rows;
        const tctx = canvas.getContext('2d');
        const image = tctx.createImageData(cols, rows);
        const colors = mapThemeColors(snapshot.theme);
        const rgb = {
            wall: hexToRgb(colors.wall),
            wallDark: hexToRgb(colors.wallDark),
            floor: hexToRgb(colors.floor),
            gate: hexToRgb(GATE_COLOR)
        };

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (!isExplored(snapshot, x, y)) continue;
                const tile = tiles[y][x];
                let c;
                if (tile === 'wall') {
                    const below = y + 1 < rows ? tiles[y + 1][x] : 'wall';
                    c = below !== 'wall' ? rgb.wall : rgb.wallDark;
                } else if (tile === 'gate') {
                    c = rgb.gate;
                } else {
                    c = rgb.floor;
                }
                const i = (y * cols + x) * 4;
                image.data[i] = c[0];
                image.data[i + 1] = c[1];
                image.data[i + 2] = c[2];
                image.data[i + 3] = 255;
            }
        }
        tctx.putImageData(image, 0, 0);
        this.thumbnails.set(snapshot.id, { key, tiles, canvas });
        return canvas;
    }
}

function hexToRgb(hex) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function drawDot(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}

// Gold dot with a white ring, so "you" never rests on telling colours apart
// at a few pixels across.
function drawPlayerMarker(ctx, x, y, r) {
    drawDot(ctx, x, y, r, PLAYER_COLOR);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = Math.max(1, r / 3);
    ctx.beginPath();
    ctx.arc(x, y, r + ctx.lineWidth / 2 + 0.5, 0, Math.PI * 2);
    ctx.stroke();
}

function drawTag(ctx, text, x, y, align, color) {
    const width = ctx.measureText(text).width;
    const left = align === 'right' ? x - width - 4 : x;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(left, y, width + 4, 12);
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.fillText(text, left + 2, y + 1);
}

function drawCenteredText(ctx, w, h, text) {
    ctx.fillStyle = '#666';
    ctx.font = '15px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);
}
