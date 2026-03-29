import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";

const SIZE = 64;
const BORDER = 3;
const INNER = SIZE - BORDER * 2;

// Load the logo with black background
const logoBuffer = readFileSync("public/images/logo_black_bg.png");

// Resize logo to fit inside the circle
const logoResized = await sharp(logoBuffer)
  .resize(INNER - 4, INNER - 4, { fit: "contain" })
  .toBuffer();

// Create circular mask for the logo
const circleMask = Buffer.from(
  `<svg width="${INNER - 4}" height="${INNER - 4}">
    <circle cx="${(INNER - 4) / 2}" cy="${(INNER - 4) / 2}" r="${(INNER - 4) / 2}" fill="white"/>
  </svg>`
);

// Apply circular mask to logo
const logoCircular = await sharp(logoResized)
  .composite([{ input: circleMask, blend: "dest-in" }])
  .png()
  .toBuffer();

// Use logo as-is (already has black background)
const logoFinal = logoCircular;

// Create the black inner circle background
const innerCircleSvg = `<svg width="${INNER}" height="${INNER}">
  <circle cx="${INNER / 2}" cy="${INNER / 2}" r="${INNER / 2}" fill="black"/>
</svg>`;

// Create the gradient border circle (yellow-green)
const outerCircleSvg = `<svg width="${SIZE}" height="${SIZE}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#c3d809"/>
      <stop offset="100%" stop-color="#1a1f00"/>
    </linearGradient>
  </defs>
  <circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2}" fill="url(#g)"/>
</svg>`;

// Compose: outer gradient circle + inner black circle + logo
const favicon = await sharp(Buffer.from(outerCircleSvg))
  .composite([
    {
      input: Buffer.from(innerCircleSvg),
      left: BORDER,
      top: BORDER,
    },
    {
      input: logoFinal,
      left: BORDER + 2,
      top: BORDER + 2,
    },
  ])
  .png()
  .toBuffer();

// Save as app/icon.png (Next.js uses this as favicon)
writeFileSync("app/icon.png", favicon);

// Also save larger versions for PWA icons
const favicon192 = await sharp(favicon).resize(192, 192).png().toBuffer();
const favicon512 = await sharp(favicon).resize(512, 512).png().toBuffer();

writeFileSync("public/icon-192.png", favicon192);
writeFileSync("public/icon-512.png", favicon512);
writeFileSync("public/apple-touch-icon.png", await sharp(favicon).resize(180, 180).png().toBuffer());

console.log("✅ Favicon generated successfully!");
