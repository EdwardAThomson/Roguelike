// Sprite definitions for the 16-bit renderer, as letter grids.
//
// Each letter is a colour region; pixelArt.rasterizeSprite outlines and
// shades every sprite the same way, so adding a monster means drawing its
// silhouette in letters and picking a palette. Grids are 16 wide, and all
// characters face right (the renderer mirrors them to face their target).
// Leave a 1px margin so the outline fits.

export const CHARACTER_SPRITES = {
    player: {
        rows: [
            '................',
            '......hhhh......',
            '.....hhhhhh.....',
            '.....hvvvvh.....',
            '.....hhhhhh..s..',
            '......hhhh..s...',
            '....aattttaas...',
            '...aaattyttaw...',
            '...aa.ttyttww...',
            '...aa.tttttta...',
            '....h.tttttt....',
            '......tttttt....',
            '......bb..bb....',
            '......bb..bb....',
            '.....bbb..bbb...'
        ],
        palette: { h: '#b8c2d4', v: '#262a38', a: '#9aa6bc', t: '#3a66c4', y: '#e8c040', b: '#5c3e2a', s: '#dfe8f4', w: '#c89a3a' }
    },
    rat: {
        rows: [
            '', '', '', '', '', '',
            '..........rr....',
            '........rrrrr...',
            '.....rrrrrrrrrp.',
            '...rrrrrrrrrerrp',
            '..rrrrrrrrrrrrr.',
            't.rrrrrrrrrrrr..',
            '.t.rrrrrrrrrr...',
            '..t.pp.....pp...'
        ],
        palette: { r: '#8a6a52', p: '#e8a0a0', e: '#ff3030', t: '#d89090' }
    },
    spider: {
        rows: [
            '', '', '',
            '.l..........l...',
            '..l..ssss..l....',
            '...lssssssl.....',
            '.llssmmmmsslll..',
            'l..sssmmssssee.l',
            '..lsssssssssel..',
            '.l..ssssssss.l..',
            'l....ssssss...l.',
            '.......ss.......'
        ],
        palette: { s: '#4a3270', m: '#c04060', e: '#ff4040', l: '#2e2040' }
    },
    bat: {
        rows: [
            '', '', '', '',
            'w.....b..b.....w',
            'ww....bbbb....ww',
            'www..bebbeb..www',
            'wwwwwbbbbbbwwwww',
            '.wwwwbbbbbbwwww.',
            '..ww..bbbb..ww..',
            '..w....bb....w..'
        ],
        palette: { b: '#6a5040', w: '#4e3c52', e: '#ff5040' }
    },
    goblin: {
        rows: [
            '', '',
            '..g..........g..',
            '..gg..gggg..gg..',
            '...ggggggggggg..',
            '.....ggeggegg...',
            '.....gggggggg...',
            '......gwggwg....',
            '.......cccc.....',
            '.....gccccccg.d.',
            '.....gccccccgd..',
            '......ccccccd...',
            '......cc..cc....',
            '......gg..gg....',
            '.....ggg..ggg...'
        ],
        palette: { g: '#5cae48', e: '#ff4020', w: '#f4f0d0', c: '#7a4a2c', d: '#c8ccd8' }
    },
    skeleton: {
        rows: [
            '',
            '......bbbb......',
            '.....bbbbbb.....',
            '.....beebeeb....',
            '.....bbbbbb.....',
            '......bkkb......',
            '.......bb.......',
            '.....bbbbbb.....',
            '....b.bbbb.b....',
            '....b.b..b.b..x.',
            '....b.bbbb.bxx..',
            '.......bb...x...',
            '......b..b......',
            '......b..b......',
            '.....bb..bb.....'
        ],
        palette: { b: '#e6e0cc', e: '#1a1424', k: '#3a3040', x: '#a07850' }
    },
    kobold: {
        rows: [
            '', '', '',
            '.....kkkk.......',
            '....kkekkk......',
            '....kkkkkkk.....',
            '.....kkkk.....s.',
            '......cc.....h..',
            '....kccccck.h...',
            '....k.cccckh....',
            '......cccch.....',
            '......k..k......',
            '.....kk..kk.....'
        ],
        palette: { k: '#b0743c', e: '#ffd040', c: '#5a6a3a', s: '#c8ccd8', h: '#6a4a2a' }
    },
    wolf: {
        rows: [
            '', '', '', '',
            '............g...',
            '...........gggg.',
            '..........ggeggg',
            'g..ggggggggggggn',
            '.gggggggggggggg.',
            '..ggggggggggg...',
            '..ggdddddddgg...',
            '..gg.......gg...',
            '..g........g....',
            '..dd.......dd...'
        ],
        palette: { g: '#8a8a96', d: '#5a5a66', e: '#ffd040', n: '#1a1424' }
    },
    orc: {
        rows: [
            '',
            '.....oooooo.....',
            '....oooooooo....',
            '....oeooooeo....',
            '....oooooooo....',
            '....otooooto....',
            '...aaoooooo.aa..',
            '..aaaaaaaaaaaa.x',
            '..oaaaaaaaaaaoxx',
            '..oaaaaaaaaaaoxx',
            '..o.aaaaaaaa.oh.',
            '....aaaaaaaa..h.',
            '....aa....aa..h.',
            '....oo....oo....',
            '...ooo....ooo...'
        ],
        palette: { o: '#7c8c4a', e: '#ffd040', t: '#f4f0dc', a: '#6a4a34', x: '#b8bcc8', h: '#6a4a2a' }
    },
    ghost: {
        alpha: 0.8,
        rows: [
            '',
            '.....wwwwww.....',
            '....wwwwwwww....',
            '...wwwwwwwwww...',
            '...wweewweeww...',
            '...wwwwwwwwww...',
            '...wwwwkkwwww...',
            '..wwwwwwwwwwww..',
            '..wwwwwwwwwwww..',
            '..wwwwwwwwwwww..',
            '..wwwwwwwwwwww..',
            '..ww.www.www.w..',
            '..w...w...w.....'
        ],
        palette: { w: '#c4d8ff', e: '#1a1424', k: '#3a3a5a' }
    },
    centaur: {
        rows: [
            '',
            '...........aa...',
            '..........asss..',
            '...........sss..',
            '..........b.ss..',
            '.........b.ssss.',
            '.........bsss.s.',
            '.........b.ss...',
            '.hhhhhhhhhhhh...',
            'hhhhhhhhhhhhh...',
            'h.hhhhhhhhhhh...',
            '..hh......hh....',
            '..hh......hh....',
            '..dd......dd....'
        ],
        palette: { h: '#9a6a40', s: '#e0b088', a: '#5a3a20', b: '#d0a050', d: '#2e2420' }
    },
    minotaur: {
        rows: [
            '..h........h....',
            '..hh.ffff.hh....',
            '...hffffffh.....',
            '....fefffef.....',
            '....ffffff......',
            '.....fnnf.......',
            '..ffffffffff..x.',
            '.ffffffffffff.xx',
            '.ff.ffffffff.wxx',
            '.ff.ffffffff.w..',
            '.....llllll..w..',
            '.....ff..ff..w..',
            '.....ff..ff.....',
            '....fff..fff....'
        ],
        palette: { h: '#e8dcc0', f: '#7a4a30', e: '#ff3020', n: '#c8a080', l: '#8a2a2a', x: '#b8bcc8', w: '#6a4a2a' }
    },
    wraith: {
        alpha: 0.88,
        rows: [
            '',
            '.....cccccc.....',
            '....cccccccc....',
            '....ccdddddc....',
            '....cdeddedc....',
            '....ccdddddc....',
            '...cccccccccc...',
            '..hcccccccccch..',
            '..hccccccccccch.',
            '...ccccccccccc..',
            '...cccccccccc...',
            '....ccccccccc...',
            '....cc.ccc.cc...',
            '.....c..c...c...'
        ],
        palette: { c: '#3e2e58', d: '#1c1428', e: '#d080ff', h: '#a888c8' }
    }
};

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
