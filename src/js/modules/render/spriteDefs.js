// Item and spell icon sprites, as letter grids.
//
// Each letter is a colour region; pixelArt.rasterizeSprite outlines and
// shades every sprite the same way. Grids are 16 wide; leave a 1px margin so
// the outline fits.

export const ITEM_SPRITES = {
    sword: {
        rows: ['', '', '...........sss..', '..........ssss..', '.........ssss...', '........ssss....', '.......ssss.....',
            '...h..ssss......', '...hhssss.......', '....hhss........', '....ghh.........', '...gg.hh........', '..gg............'],
        palette: { s: '#d6deec', h: '#c89a3a', g: '#6a4428' }
    },
    dagger: {
        rows: ['', '', '', '', '..........ss....', '.........sss....', '........sss.....', '.......sss......',
            '....h.sss.......', '.....hss........', '.....gh.........', '....gg.h........'],
        palette: { s: '#d6deec', h: '#c89a3a', g: '#6a4428' }
    },
    axe: {
        rows: ['', '', '........xxx.....', '.......xxxxx....', '......xxxwxxx...', '.......xxwxx....', '........xw......',
            '........w.......', '.......w........', '......w.........', '.....w..........', '....w...........', '...w............'],
        palette: { x: '#c0c6d4', w: '#7a5030' }
    },
    mace: {
        rows: ['', '', '..........mm....', '.........mmmm...', '........mmmmmm..', '.........mmmm...', '..........mm....',
            '.........w......', '........w.......', '.......w........', '......w.........', '.....w..........', '....g...........'],
        palette: { m: '#9aa2b4', w: '#7a5030', g: '#c89a3a' }
    },
    staff: {
        rows: ['', '..........oo....', '.........oooo...', '.........oooo...', '..........oo....', '.........w......',
            '........w.......', '.......w........', '......w.........', '.....w..........', '....w...........', '...w............', '..w.............'],
        palette: { o: '#60d0a0', w: '#8a6038' }
    },
    staff_of_flames: {
        rows: ['', '..........oo....', '.........oooo...', '.........oooo...', '..........oo....', '.........w......',
            '........w.......', '.......w........', '......w.........', '.....w..........', '....w...........', '...w............', '..w.............'],
        palette: { o: '#ff8030', w: '#5a3a28' }
    },
    bow: {
        rows: ['', '......bb........', '......sbb.......', '......s.b.......', '......s.bb......', '......s..b......',
            '......s..b......', '......s..b......', '......s.bb......', '......s.b.......', '......sbb.......', '......bb........'],
        palette: { b: '#a8743c', s: '#e8e0d0' }
    },
    crossbow: {
        rows: ['', '', '.........b......', '.........bb.....', '..........b.....', '.wwwwwwwwwbww...',
            '.wwwwwwwwwbww...', '..........b.....', '.........bb.....', '.........b......'],
        palette: { b: '#9aa2b4', w: '#7a5030' }
    },
    blowgun: {
        rows: ['', '', '', '', '', '', '..wwwwwwwwwwwk..', '..wwwwwwwwwwwk..'],
        palette: { w: '#a0b050', k: '#5a4a30' }
    },
    helmet: {
        rows: ['', '', '', '.....hhhhhh.....', '....hhhhhhhh....', '...hhhhhhhhhh...', '...hhhhhhhhhh...',
            '...hhvvvvvvhh...', '...hh......hh...'],
        palette: { h: '#a8b0c4', v: '#2a2e3c' }
    },
    cap: {
        rows: ['', '', '', '', '.....hhhhhh.....', '....hhhhhhhh....', '...hhhhhhhhhh...', '...vvvvvvvvvv...'],
        palette: { h: '#8a5a34', v: '#5a3a22' }
    },
    armor: {
        rows: ['', '', '....aa....aa....', '...aaaaaaaaaa...', '..aaaaaaaaaaaa..', '..aa.aaaaaa.aa..', '.....aaaaaa.....',
            '.....aaaaaa.....', '.....aattaa.....', '.....aaaaaa.....', '.....aaaaaa.....'],
        palette: { a: '#9aa2b4', t: '#7a5030' }
    },
    leather_armor: {
        rows: ['', '', '....aa....aa....', '...aaaaaaaaaa...', '..aaaaaaaaaaaa..', '..aa.aaaaaa.aa..', '.....aaaaaa.....',
            '.....aaaaaa.....', '.....aattaa.....', '.....aaaaaa.....', '.....aaaaaa.....'],
        palette: { a: '#8a5a34', t: '#c89a3a' }
    },
    boots: {
        rows: ['', '', '', '', '...bb.....bb....', '...bb.....bb....', '...bb.....bb....', '...bb.....bb....',
            '...bbbb...bbbb..', '...bbbb...bbbb..'],
        palette: { b: '#7a5030' }
    },
    shield: {
        rows: ['', '', '....ssssssss....', '...ssssssssss...', '...sssseessss...', '...ssseeeesss...', '...sssseessss...',
            '....ssssssss....', '.....ssssss.....', '......ssss......', '.......ss.......'],
        palette: { s: '#8a9ab8', e: '#c89a3a' }
    },
    ring: {
        rows: ['', '', '', '', '', '......gg........', '.....rggr.......', '....r....r......', '....r....r......',
            '.....r..r.......', '......rr........'],
        palette: { g: '#e04060', r: '#f0c838' }
    },
    amulet: {
        rows: ['', '', '....c......c....', '.....c....c.....', '......c..c......', '.......gg.......', '......gggg......', '.......gg.......'],
        palette: { c: '#c8a050', g: '#50c8e0' }
    },
    tome: {
        rows: ['', '', '....bbbbbbbb....', '...bbbbbbbbbp...', '...bbbgggbbbp...', '...bbbbgbbbbp...', '...bbbbbbbbbp...',
            '...bbbbbbbbbp...', '...bbbbbbbbbp...', '....bbbbbbbbp...'],
        palette: { b: '#8a2a3a', g: '#f0c838', p: '#e8e0d0' }
    },
    potion_health: {
        rows: ['', '', '', '.......cc.......', '.......cc.......', '......gggg......', '.......gg.......', '......grrg......',
            '.....grrrrg.....', '.....rrrrrr.....', '.....rrrrrr.....', '......rrrr......'],
        palette: { c: '#8a6040', g: '#a8c8d8', r: '#e02848' }
    },
    potion_mana: {
        rows: ['', '', '', '.......cc.......', '.......cc.......', '......gggg......', '.......gg.......', '......grrg......',
            '.....grrrrg.....', '.....rrrrrr.....', '.....rrrrrr.....', '......rrrr......'],
        palette: { c: '#8a6040', g: '#a8c8d8', r: '#3060e0' }
    },
    scroll: {
        rows: ['', '', '', '...rrrrrrrrrr...', '....pppppppp....', '....pkkkkkkp....', '....pppppppp....', '....pkkkkkpp....',
            '....pppppppp....', '...rrrrrrrrrr...'],
        palette: { r: '#b08a5a', p: '#ece0c0', k: '#7a6a5a' }
    },
    wand: {
        rows: ['', '', '', '...........ss...', '..........sss...', '..........ss....', '.........w......', '........w.......',
            '.......w........', '......w.........', '.....w..........', '....w...........'],
        palette: { s: '#c0a0ff', w: '#6a4a8a' }
    },
    wand_of_frost: {
        rows: ['', '', '', '...........ss...', '..........sss...', '..........ss....', '.........w......', '........w.......',
            '.......w........', '......w.........', '.....w..........', '....w...........'],
        palette: { s: '#a0e8ff', w: '#5a7a9a' }
    },
    gold: {
        rows: ['', '', '', '', '', '', '', '......yyy.......', '....yyyyyyy.....', '...yyyyyyyyy....', '..yyyyyyyyyyy...'],
        palette: { y: '#f0c838' }
    },
    key: {
        rows: ['', '', '', '', '', '....yyy.........', '...y...y........', '...y...yyyyyyy..', '...y...y...y.y..', '....yyy.........'],
        palette: { y: '#f0c838' }
    },
    bag: {
        rows: ['', '', '', '.......tt.......', '......bbbb......', '.....bbbbbb.....', '....bbbbbbbb....', '....bbbbbbbb....',
            '....bbbbbbbb....', '.....bbbbbb.....'],
        palette: { b: '#9a7048', t: '#c89a3a' }
    }
};

// Spell icons for the HUD hotbar and the spellbook, keyed by spell id. Not
// drawn on the map; they replace the emoji the spell database carries.
export const SPELL_SPRITES = {
    magic_dart: {
        rows: ['', '..........pppp..', '...........ppp..', '..........pwpp..', '.........pw..p..', '........pw......',
            '.......pw.......', '......pw........', '.....pw.........', '....pw..........', '...pp...........', '..p.p...........'],
        palette: { p: '#a070f0', w: '#e8d8ff' }
    },
    magic_missile: {
        rows: ['', '.......p........', '.......p........', '......ppp.......', '......pwp.......', '..ppppwwwpppp...',
            '......pwp.......', '......ppp.......', '.......p........', '.......p........'],
        palette: { p: '#b080ff', w: '#f0e8ff' }
    },
    fireball: {
        rows: ['', '.........r......', '........rr..r...', '.......rorr.rr..', '......roooorr...', '.....rooyyoor...',
            '....rooyyyyor...', '....royywwyor...', '....royywwyor...', '....rooyyyyor...', '.....rooyyor....',
            '......roooor....', '.......rrrr.....'],
        palette: { r: '#c8381e', o: '#f07828', y: '#ffc848', w: '#fff4c0' }
    },
    lightning_bolt: {
        rows: ['', '.........yyyy...', '........yyyy....', '.......yyyy.....', '......yyyy......', '.....yyyyyyyy...',
            '.........yyy....', '........yyy.....', '.......yyy......', '......yy........', '.....yy.........', '....y...........'],
        palette: { y: '#ffe060' }
    },
    ice_shard: {
        rows: ['', '.......b........', '......bwb.......', '......bwb.......', '.....bbwbb......', '.....bwbbb......',
            '....bbwbbbb.....', '....bwbbbbb.....', '.....bbbbb......', '.....bbbbb......', '......bbb.......',
            '......bbb.......', '.......b........'],
        palette: { b: '#80c8f0', w: '#e8f8ff' }
    },
    poison_cloud: {
        rows: ['', '', '.....gg.........', '....gggg.gg.....', '...gglggggggg...', '..gglllggggggg..',
            '..ggllgggggdgg..', '..ggggggggdddg..', '...gggddddddg...', '....gggggggg....', '', '....g...g...g...'],
        palette: { g: '#70c040', l: '#b0f080', d: '#4a8a2a' }
    },
    heal: {
        rows: ['', '', '......hhhh......', '......hwwh......', '......hwwh......', '..hhhhhwwhhhhh..',
            '..hwwwwwwwwwwh..', '..hwwwwwwwwwwh..', '..hhhhhwwhhhhh..', '......hwwh......', '......hwwh......',
            '......hhhh......'],
        palette: { h: '#3aa850', w: '#8ef0a0' }
    },
    regeneration: {
        rows: ['', '', '...hh....hh.....', '..hwhh..hhhh....', '.hwhhhhhhhhhh...', '.hhhhhhhhhhhh...',
            '.hhhhhhhhhhhh...', '..hhhhhhhhhh....', '...hhhhhhhh.....', '....hhhhhh......', '.....hhhh.......',
            '......hh........'],
        palette: { h: '#48c060', w: '#c8ffd0' }
    },
    teleport: {
        rows: ['', '.....pppppp.....', '....pp....pp....', '...pp.pppp.pp...', '...p.pp..pp.p...', '...p.p.pp.p.p...',
            '...p.p.p..p.p...', '...p.pp.ppp.p...', '...pp.p.....p...', '....pp.pppppp...', '.....pp.........'],
        palette: { p: '#60a0ff' }
    },
    shield: {
        rows: ['', '....gggggggg....', '....gbbbbbbg....', '....gbbwbbbg....', '....gbbwbbbg....', '....gbwbbbbg....',
            '....gbbbbbbg....', '.....gbbbbg.....', '......gbbg......', '.......gg.......'],
        palette: { g: '#d8a64a', b: '#4878c8', w: '#a8c8ff' }
    }
};
