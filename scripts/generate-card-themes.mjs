// Generates the built-in card themes under public/cards/<theme>/.
//
// Each theme folder holds 52 SVG images named <rank>_of_<suit>.svg (or .png for
// custom raster themes). The naming convention is:
//
//   rank: 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A, 2
//   suit: spades, hearts, clubs, diamonds
//
// e.g. 3_of_diamonds.svg, 10_of_spades.svg, A_of_hearts.svg.
//
// Available themes are advertised to the app via public/cards/themes.json:
//
//   { "themes": [{ "id": "default", "name": "Classic", "ext": "svg" }] }
//
// Run: node scripts/generate-card-themes.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CARDS_DIR = join(ROOT, 'public', 'cards');

const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
const SUITS = ['spades', 'hearts', 'clubs', 'diamonds'];
const SUIT_SYMBOLS = { spades: '♠', hearts: '♥', clubs: '♣', diamonds: '♦' };

const THEMES = [
  { id: 'default', name: 'Classic', ext: 'svg' },
  { id: 'pixel', name: 'Pixel', ext: 'svg' },
  { id: 'cute', name: 'Cute', ext: 'svg' },
  { id: 'classy', name: 'Classy', ext: 'svg' },
];

const RED = ['hearts', 'diamonds'];

// Palette override per theme for the pixel-style cards. A null palette means
// the default Pixel colors are used.
const THEME_PALETTES = {
  cute: {
    ink: '#b05a6b',
    paper: '#fdf6f0',
    paperInner: '#fffdf8',
    red: '#ff8fab',
    black: '#b7e3b1',
  },
};

// Palette overrides for the smooth (Classic-style) cards. A null palette means
// the default Classic colors are used.
const CUTE_PALETTE = {
  bg: '#fff7fa',
  border: '#f3a7bd',
  red: '#ff6b9d',
  black: '#7ccb7a',
  stroke: '#ffd9e6',
};

const CLASSY_PALETTE = {
  bg: '#722F37',
  border: '#D4AF37',
  red: '#FFD700',
  black: '#1a1a2e',
  stroke: '#B8860B',
};

function cardSvg(rank, suit, palette = null) {
  const p = palette || { red: '#dc2626', black: '#0f172a', bg: '#ffffff', border: '#94a3b8' };
  const color = RED.includes(suit) ? p.red : p.black;
  const symbol = SUIT_SYMBOLS[suit];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="224" viewBox="0 0 160 224">
  <defs>
    <clipPath id="clip">
      <rect x="1" y="1" width="158" height="222" rx="14"/>
    </clipPath>
  </defs>
  <rect x="1" y="1" width="158" height="222" rx="14" fill="${p.bg}" stroke="${p.border}" stroke-width="2"/>
  <g clip-path="url(#clip)" fill="${color}">
    <text x="16" y="34" font-family="Georgia, serif" font-size="34" font-weight="700">${rank}</text>
    <text x="16" y="56" font-family="Georgia, serif" font-size="28">${symbol}</text>
    <text x="80" y="120" font-family="Georgia, serif" font-size="96" text-anchor="middle">${symbol}</text>
    <g transform="rotate(180 80 112)">
      <text x="16" y="34" font-family="Georgia, serif" font-size="34" font-weight="700">${rank}</text>
      <text x="16" y="56" font-family="Georgia, serif" font-size="28">${symbol}</text>
    </g>
  </g>
</svg>
`;
}

// ---------------------------------------------------------------------------
// Pixel theme
// ---------------------------------------------------------------------------

// Each glyph is a tiny bitmap of '#' (ink) and '.' (empty). The cards are
// rendered at a chunky pixel scale so the raster feel carries through.
const PIXEL_FONT = {
  '3': [
    '.###.',
    '..#..',
    '..#..',
    '.###.',
    '....#',
    '....#',
    '.###.',
  ],
  '4': [
    '...##',
    '..###',
    '.#.##',
    '##.##',
    '#####',
    '..#..',
    '..#..',
  ],
  '5': [
    '####.',
    '#....',
    '#....',
    '####.',
    '....#',
    '....#',
    '####.',
  ],
  '6': [
    '.###.',
    '#....',
    '#....',
    '####.',
    '#..##',
    '#...#',
    '.###.',
  ],
  '7': [
    '#####',
    '....#',
    '...#.',
    '..#..',
    '.#...',
    '#....',
    '#....',
  ],
  '8': [
    '.###.',
    '#...#',
    '#...#',
    '.###.',
    '#...#',
    '#...#',
    '.###.',
  ],
  '9': [
    '.###.',
    '#...#',
    '#..##',
    '.###.',
    '....#',
    '...#.',
    '.##..',
  ],
  '10': [
    '#....#',
    '#....#',
    '#..###',
    '#.#.##',
    '###.##',
    '....#.',
    '...##.',
  ],
  'J': [
    '..###.',
    '...#..',
    '...#..',
    '...#..',
    '...#..',
    '#..#..',
    '.##...',
  ],
  'Q': [
    '.###..',
    '#...#.',
    '#...#.',
    '#...#.',
    '#.#.#.',
    '##..#.',
    '.####.',
  ],
  'K': [
    '#...#.',
    '#..##.',
    '#.#...',
    '##....',
    '#.#...',
    '#..##.',
    '#...#.',
  ],
  'A': [
    '.###..',
    '#...#.',
    '#...#.',
    '#####.',
    '#...#.',
    '#...#.',
    '#...#.',
  ],
  '2': [
    '.###.',
    '#...#',
    '....#',
    '...#.',
    '..#..',
    '.#...',
    '#####',
  ],
};

// 7x6 suit glyphs used for the large center and corner symbols.
const PIXEL_SUIT = {
  spades: [
    '...#...',
    '..###..',
    '.#####.',
    '.#####.',
    '..###..',
    '...#...',
  ],
  hearts: [
    '.#.#.#.',
    '#######',
    '#######',
    '######.',
    '.###...',
    '..#....',
  ],
  clubs: [
    '.#.#.#.',
    '..###..',
    '.###.#.',
    '.#####.',
    '..###..',
    '...#...',
  ],
  diamonds: [
    '...#...',
    '..###..',
    '.#####.',
    '#######',
    '.#####.',
    '..###..',
  ],
};

function pixelGlyphSvg(bitmap, x, y, cell, color, flip = false) {
  let rects = '';
  for (let r = 0; r < bitmap.length; r++) {
    for (let c = 0; c < bitmap[r].length; c++) {
      if (bitmap[r][c] !== '#') continue;
      const px = flip ? x + (bitmap[r].length - 1 - c) * cell : x + c * cell;
      const py = flip ? y + (bitmap.length - 1 - r) * cell : y + r * cell;
      rects += `    <rect x="${px}" y="${py}" width="${cell}" height="${cell}"/>\n`;
    }
  }
  return `<g fill="${color}">\n${rects}  </g>`;
}

function pixelCardSvg(rank, suit, themeId) {
  const palette = {
    ink: '#10141f',
    paper: '#f6f1e3',
    paperInner: '#fffdf4',
    red: '#e8393f',
    black: '#10141f',
    ...(THEME_PALETTES[themeId] || {}),
  };
  const color = RED.includes(suit) ? palette.red : palette.black;
  const symbol = PIXEL_SUIT[suit];

  // Card face (cream) + chunky outer border, all sharp pixel corners.
  const parts = [];

  // Background card body with stepped pixel border.
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="224" viewBox="0 0 160 224" shape-rendering="crispEdges">
  <rect width="160" height="224" fill="${palette.ink}"/>
  <rect x="4" y="4" width="152" height="216" fill="${palette.paper}"/>
  <rect x="8" y="8" width="144" height="208" fill="${palette.paperInner}"/>
  <rect x="4" y="4" width="152" height="216" fill="none" stroke="${palette.ink}" stroke-width="2"/>
  <rect x="8" y="8" width="144" height="208" fill="none" stroke="${palette.ink}" stroke-width="1"/>
  <rect x="12" y="12" width="136" height="200" fill="none" stroke="${palette.ink}" stroke-width="1"/>`);

  const px = 16; // pixel cell size for big center suit
  const cornerCell = 7;

  // Top-left corner rank + suit
  const rankTop = 26;
  const cornerX = 22;
  parts.push(pixelGlyphSvg(PIXEL_FONT[rank], cornerX, rankTop, cornerCell, color));
  parts.push(pixelGlyphSvg(symbol, cornerX, rankTop + 7 * cornerCell + 8, cornerCell, color));

  // Bottom-right corner (rotated 180)
  parts.push(`  <g transform="rotate(180 80 112)">`);
  parts.push(pixelGlyphSvg(PIXEL_FONT[rank], cornerX, rankTop, cornerCell, color));
  parts.push(pixelGlyphSvg(symbol, cornerX, rankTop + 7 * cornerCell + 8, cornerCell, color));
  parts.push(`  </g>`);

  // Large center suit symbol
  const bigW = symbol[0].length * px;
  const bigH = symbol.length * px;
  const bigX = (160 - bigW) / 2;
  const bigY = (224 - bigH) / 2;
  parts.push(pixelGlyphSvg(symbol, bigX, bigY, px, color));

  parts.push(`</svg>
`);
  return parts.join('\n');
}

for (const theme of THEMES) {
  const dir = join(CARDS_DIR, theme.id);
  mkdirSync(dir, { recursive: true });
  const gen =
    theme.id === 'pixel'
      ? (rank, suit) => pixelCardSvg(rank, suit, theme.id)
      : theme.id === 'cute'
        ? (rank, suit) => cardSvg(rank, suit, CUTE_PALETTE)
        : theme.id === 'classy'
          ? (rank, suit) => cardSvg(rank, suit, CLASSY_PALETTE)
          : cardSvg;
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      const file = join(dir, `${rank}_of_${suit}.${theme.ext}`);
      writeFileSync(file, gen(rank, suit));
    }
  }
  console.log(`Generated 52 cards in public/cards/${theme.id}/`);
}

writeFileSync(
  join(CARDS_DIR, 'themes.json'),
  JSON.stringify({ themes: THEMES }, null, 2) + '\n',
);
console.log('Wrote public/cards/themes.json');
