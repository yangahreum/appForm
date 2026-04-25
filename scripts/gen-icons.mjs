import sharp from 'sharp';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../public/icons');

// 문서 + 마법지팡이 + 스파클 아이콘
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" shape-rendering="geometricPrecision">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#5B50EF"/>
      <stop offset="100%" stop-color="#9B3AEF"/>
    </linearGradient>
    <linearGradient id="docShad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#EEF2FF"/>
      <stop offset="100%" stop-color="#E0E7FF"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="2" dy="3" stdDeviation="4" flood-color="#3730A3" flood-opacity="0.28"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="128" height="128" rx="26" fill="url(#bg)"/>

  <!-- Document shadow -->
  <rect x="19" y="22" width="66" height="84" rx="9"
        fill="#3730A3" opacity="0.25" transform="translate(3,4)"/>

  <!-- Document body -->
  <rect x="19" y="22" width="66" height="84" rx="9" fill="white"/>

  <!-- Corner fold crease -->
  <path d="M67,22 L85,40 L67,40 Z" fill="#C7D2FE"/>
  <path d="M67,22 L85,40 L67,40 Z" fill="white" opacity="0.35"/>
  <line x1="67" y1="22" x2="85" y2="40" stroke="#A5B4FC" stroke-width="1"/>

  <!-- Form label + field rows -->
  <!-- Row 1 -->
  <rect x="29" y="50" width="16" height="3.5" rx="1.75" fill="#C7D2FE"/>
  <rect x="29" y="56" width="46" height="6" rx="3" fill="#E0E7FF"/>
  <!-- Row 2 -->
  <rect x="29" y="68" width="20" height="3.5" rx="1.75" fill="#C7D2FE"/>
  <rect x="29" y="74" width="36" height="6" rx="3" fill="#E0E7FF"/>
  <!-- Row 3 -->
  <rect x="29" y="86" width="24" height="3.5" rx="1.75" fill="#C7D2FE"/>
  <rect x="29" y="92" width="42" height="6" rx="3" fill="#E0E7FF"/>

  <!-- Auto-fill shimmer on fields (partially filled tint) -->
  <rect x="29" y="56" width="30" height="6" rx="3" fill="#818CF8" opacity="0.4"/>
  <rect x="29" y="74" width="22" height="6" rx="3" fill="#818CF8" opacity="0.35"/>
  <rect x="29" y="92" width="36" height="6" rx="3" fill="#818CF8" opacity="0.3"/>

  <!-- Magic wand body -->
  <line x1="64" y1="102" x2="108" y2="38"
        stroke="#F59E0B" stroke-width="7" stroke-linecap="round"
        stroke-linejoin="round"/>

  <!-- Wand handle grip bands -->
  <line x1="64" y1="102" x2="72" y2="90"
        stroke="#92400E" stroke-width="7" stroke-linecap="round"/>

  <!-- Wand tip 4-pointed star -->
  <g transform="translate(108,35)">
    <path d="M0,-11 L2.5,-2.5 L11,-2.5 L4.5,2.5 L7,11 L0,6 L-7,11 L-4.5,2.5 L-11,-2.5 L-2.5,-2.5 Z"
          fill="#FBBF24"/>
    <path d="M0,-7 L1.6,-1.6 L7,-1.6 L2.9,1.6 L4.5,7 L0,3.8 L-4.5,7 L-2.9,1.6 L-7,-1.6 L-1.6,-1.6 Z"
          fill="#FDE68A"/>
  </g>

  <!-- Sparkle: 4-pointed star top-right -->
  <g transform="translate(112,18)">
    <path d="M0,-6 L1.4,-1.4 L6,-1.4 L2.1,1.4 L3.5,6 L0,3.5 L-3.5,6 L-2.1,1.4 L-6,-1.4 L-1.4,-1.4 Z"
          fill="#FDE68A"/>
  </g>

  <!-- Sparkle: small circle top -->
  <circle cx="96" cy="14" r="3.2" fill="#FDE68A" opacity="0.85"/>

  <!-- Sparkle: tiny dot -->
  <circle cx="120" cy="54" r="2.2" fill="#FDE68A" opacity="0.7"/>

  <!-- Sparkle: cross flare near wand tip -->
  <g transform="translate(100,20) rotate(15)">
    <rect x="-1" y="-6" width="2" height="12" rx="1" fill="#FDE68A" opacity="0.7"/>
    <rect x="-6" y="-1" width="12" height="2" rx="1" fill="#FDE68A" opacity="0.7"/>
  </g>
</svg>`;

const sizes = [16, 32, 48, 128];

for (const size of sizes) {
  const outPath = path.join(OUT_DIR, `icon${size}.png`);
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`✓ icon${size}.png`);
}

console.log('Done.');
