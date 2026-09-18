/**
 * "Fracture Bloom" — a 100-piece generative art collection.
 * Pure SVG, zero external dependencies (works with no network access,
 * and every image stays crisp + tiny — good for IPFS pinning costs too).
 *
 * Each token is a radially-symmetric "bloom" built from layered petal
 * shapes, a background field, a core motif, and an optional overlay/glow.
 * Traits are derived deterministically from the token ID via a seeded PRNG,
 * so regenerating is reproducible, and rarity is genuinely distributed
 * (not just randomly re-rolled hoping for uniqueness).
 */

const fs = require("fs");
const path = require("path");

const COLLECTION_SIZE = 100;
const OUT_IMAGES = path.join(__dirname, "..", "output", "images");
const OUT_META = path.join(__dirname, "..", "output", "metadata");

fs.mkdirSync(OUT_IMAGES, { recursive: true });
fs.mkdirSync(OUT_META, { recursive: true });

// ---------- deterministic PRNG (mulberry32) ----------
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function weightedPick(rng, entries) {
  // entries: [{ value, weight }]
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let r = rng() * total;
  for (const e of entries) {
    if (r < e.weight) return e.value;
    r -= e.weight;
  }
  return entries[entries.length - 1].value;
}

// ---------- trait tables ----------
const BACKGROUNDS = [
  { name: "Dawn", stops: ["#FFE8D6", "#FFB4A2"] },
  { name: "Dusk", stops: ["#3A2E5C", "#1B1035"] },
  { name: "Void", stops: ["#0D0D0F", "#1A1A22"] },
  { name: "Coral Reef", stops: ["#FF7B7B", "#4EC5C1"] },
  { name: "Mint Fog", stops: ["#D9F2E6", "#8FD9C4"] },
  { name: "Ember", stops: ["#2B0A0A", "#B5402A"] },
  { name: "Deep Sea", stops: ["#021C34", "#04516E"] },
];

const PALETTES = [
  { name: "Sunset", colors: ["#FF6B6B", "#FFA36C", "#FFD56B", "#FF8FA3"] },
  { name: "Botanic", colors: ["#2E7D32", "#66BB6A", "#A5D6A7", "#1B5E20"] },
  { name: "Royal", colors: ["#5E35B1", "#7E57C2", "#B39DDB", "#311B92"] },
  { name: "Monochrome", colors: ["#F5F5F5", "#BDBDBD", "#757575", "#212121"] },
  { name: "Citrus", colors: ["#FDD835", "#FB8C00", "#F4511E", "#FFF176"] },
  { name: "Glacier", colors: ["#4FC3F7", "#0288D1", "#B3E5FC", "#01579B"] },
  { name: "Rose Gold", colors: ["#E8B4B8", "#D4A5A5", "#C97B7B", "#F6E3E1"] },
];

const PETAL_COUNTS = [
  { value: 5, weight: 22 },
  { value: 6, weight: 20 },
  { value: 7, weight: 18 },
  { value: 8, weight: 16 },
  { value: 9, weight: 12 },
  { value: 10, weight: 8 },
  { value: 12, weight: 4 }, // rare
];

const CORE_SHAPES = ["Circle", "Hexagon", "Diamond", "Star"];

const OVERLAYS = [
  { value: "None", weight: 40 },
  { value: "Dots", weight: 25 },
  { value: "Rings", weight: 20 },
  { value: "Rays", weight: 15 },
];

const GLOW_CHANCE = 0.08; // ~8% get a legendary golden aura

// ---------- geometry helpers ----------
function polar(cx, cy, r, angleDeg) {
  const a = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function petalPath(cx, cy, angle, length, width) {
  const [tipX, tipY] = polar(cx, cy, length, angle);
  const [l1x, l1y] = polar(cx, cy, length * 0.45, angle - width);
  const [l2x, l2y] = polar(cx, cy, length * 0.45, angle + width);
  return `M ${cx} ${cy} Q ${l1x} ${l1y} ${tipX} ${tipY} Q ${l2x} ${l2y} ${cx} ${cy} Z`;
}

function coreShapePath(shape, cx, cy, r) {
  switch (shape) {
    case "Circle":
      return `<circle cx="${cx}" cy="${cy}" r="${r}" />`;
    case "Hexagon": {
      const pts = Array.from({ length: 6 }, (_, i) => polar(cx, cy, r, i * 60 - 90).join(","));
      return `<polygon points="${pts.join(" ")}" />`;
    }
    case "Diamond": {
      const pts = [polar(cx, cy, r, -90), polar(cx, cy, r, 0), polar(cx, cy, r, 90), polar(cx, cy, r, 180)]
        .map((p) => p.join(","));
      return `<polygon points="${pts.join(" ")}" />`;
    }
    case "Star": {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? r : r * 0.45;
        pts.push(polar(cx, cy, rad, i * 36 - 90).join(","));
      }
      return `<polygon points="${pts.join(" ")}" />`;
    }
    default:
      return "";
  }
}

function overlaySvg(kind, cx, cy, color, rng) {
  if (kind === "None") return "";
  if (kind === "Dots") {
    let s = "";
    for (let i = 0; i < 24; i++) {
      const ang = rng() * 360;
      const rad = 60 + rng() * 260;
      const [x, y] = polar(cx, cy, rad, ang);
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1 + rng() * 2).toFixed(1)}" fill="${color}" opacity="0.5" />`;
    }
    return s;
  }
  if (kind === "Rings") {
    let s = "";
    for (let i = 1; i <= 4; i++) {
      s += `<circle cx="${cx}" cy="${cy}" r="${i * 55}" fill="none" stroke="${color}" stroke-width="1" opacity="${0.35 - i * 0.05}" />`;
    }
    return s;
  }
  if (kind === "Rays") {
    let s = "";
    for (let i = 0; i < 16; i++) {
      const ang = i * 22.5;
      const [x1, y1] = polar(cx, cy, 150, ang);
      const [x2, y2] = polar(cx, cy, 380, ang);
      s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="1.5" opacity="0.25" />`;
    }
    return s;
  }
  return "";
}

// ---------- main render ----------
function renderToken(id) {
  const rng = mulberry32(id * 2654435761);

  const background = pick(rng, BACKGROUNDS);
  const palette = pick(rng, PALETTES);
  const petalCount = weightedPick(rng, PETAL_COUNTS);
  const coreShape = pick(rng, CORE_SHAPES);
  const overlay = weightedPick(rng, OVERLAYS);
  const hasGlow = rng() < GLOW_CHANCE;
  const petalLength = 200 + rng() * 110;
  const petalWidth = 10 + rng() * 14;
  const rotationOffset = rng() * 360;

  const cx = 300;
  const cy = 300;
  const bgId = `bg${id}`;
  const glowId = `glow${id}`;

  let petals = "";
  for (let i = 0; i < petalCount; i++) {
    const angle = rotationOffset + (360 / petalCount) * i;
    const color = palette.colors[i % palette.colors.length];
    const d = petalPath(cx, cy, angle, petalLength, petalWidth);
    petals += `<path d="${d}" fill="${color}" opacity="0.88" ${hasGlow ? `filter="url(#${glowId})"` : ""} />`;
  }

  const coreColor = palette.colors[palette.colors.length - 1];
  const coreEl = coreShapePath(coreShape, cx, cy, 34).replace(
    "<circle",
    `<circle fill="${coreColor}"`
  ).replace("<polygon", `<polygon fill="${coreColor}"`);

  const overlayColor = "#FFFFFF";
  const overlayEl = overlaySvg(overlay, cx, cy, overlayColor, rng);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <linearGradient id="${bgId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${background.stops[0]}" />
      <stop offset="100%" stop-color="${background.stops[1]}" />
    </linearGradient>
    ${hasGlow ? `<filter id="${glowId}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>` : ""}
  </defs>
  <rect width="600" height="600" fill="url(#${bgId})" />
  ${overlayEl}
  <g>${petals}</g>
  ${coreEl}
  ${hasGlow ? `<circle cx="${cx}" cy="${cy}" r="260" fill="none" stroke="#FFD700" stroke-width="2" opacity="0.35" />` : ""}
</svg>`;

  const attributes = [
    { trait_type: "Background", value: background.name },
    { trait_type: "Palette", value: palette.name },
    { trait_type: "Petal Count", value: petalCount },
    { trait_type: "Core Shape", value: coreShape },
    { trait_type: "Overlay", value: overlay },
    { trait_type: "Aura", value: hasGlow ? "Golden Glow" : "None" },
  ];

  return { svg, attributes };
}

// ---------- dedupe pass ----------
const seen = new Set();
const tokens = [];
let id = 1;
let attempts = 0;

while (tokens.length < COLLECTION_SIZE && attempts < COLLECTION_SIZE * 20) {
  attempts++;
  const { svg, attributes } = renderToken(id);
  const signature = JSON.stringify(attributes);
  if (seen.has(signature)) {
    id++; // try the next seed
    continue;
  }
  seen.add(signature);
  tokens.push({ tokenId: tokens.length, svg, attributes });
  id++;
}

// ---------- write files ----------
const COLLECTION_NAME = "Fracture Bloom";
const COLLECTION_DESC =
  "Fracture Bloom is a 100-piece generative art collection of radially-symmetric blooms, each rendered as pure vector art from a unique seed. No two blooms share the same combination of background, palette, petal count, core shape and overlay.";
const EXTERNAL_URL = "https://your-mint-site.vercel.app"; // update after deploying the frontend
const IMAGE_BASE_URI = "ipfs://REPLACE_WITH_IMAGES_CID"; // update after pinning images/ to IPFS

for (const t of tokens) {
  fs.writeFileSync(path.join(OUT_IMAGES, `${t.tokenId}.svg`), t.svg);

  const metadata = {
    name: `${COLLECTION_NAME} #${t.tokenId}`,
    description: COLLECTION_DESC,
    image: `${IMAGE_BASE_URI}/${t.tokenId}.svg`,
    external_url: EXTERNAL_URL,
    attributes: t.attributes,
  };
  fs.writeFileSync(
    path.join(OUT_META, `${t.tokenId}`), // no extension — standard for on-chain metadata servers
    JSON.stringify(metadata, null, 2)
  );
  // also write a .json copy for easy browsing/upload previews
  fs.writeFileSync(
    path.join(OUT_META, `${t.tokenId}.json`),
    JSON.stringify(metadata, null, 2)
  );
}

console.log(`Generated ${tokens.length} unique tokens.`);
console.log(`Images:   ${OUT_IMAGES}`);
console.log(`Metadata: ${OUT_META}`);
