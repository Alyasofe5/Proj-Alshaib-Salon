import sharp from "sharp";

// OG Image standard size: 1200x630
const WIDTH = 1200;
const HEIGHT = 630;

// Logo size in the OG image
const LOGO_SIZE = 300;

// Create dark background with gradient
const background = `
<svg width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#1a1a1a"/>
    </linearGradient>
    <linearGradient id="border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#c3d809"/>
      <stop offset="100%" stop-color="#8a9a00"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  
  <!-- Logo circle with gradient border -->
  <circle cx="${WIDTH / 2}" cy="${HEIGHT / 2}" r="${LOGO_SIZE / 2 + 6}" fill="url(#border)"/>
  <circle cx="${WIDTH / 2}" cy="${HEIGHT / 2}" r="${LOGO_SIZE / 2}" fill="#000000"/>
  
  <!-- Text -->
  <text x="${WIDTH / 2}" y="100" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="900" fill="#ffffff">MAQASS</text>
  <text x="${WIDTH / 2}" y="140" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="600" fill="#c3d809" letter-spacing="8">SALON PLATFORM</text>
  
  <text x="${WIDTH / 2}" y="580" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="600" fill="#e0e0e0">منصة إدارة الصالونات الأولى في الأردن</text>
</svg>
`;

// Load and resize logo
const logo = await sharp("public/images/logo_new.png")
  .resize(LOGO_SIZE - 20, LOGO_SIZE - 20, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
  .toBuffer();

// Compose the final OG image
await sharp(Buffer.from(background))
  .composite([
    {
      input: logo,
      left: Math.round((WIDTH - (LOGO_SIZE - 20)) / 2),
      top: Math.round((HEIGHT - (LOGO_SIZE - 20)) / 2),
    }
  ])
  .png({ quality: 95 })
  .toFile("public/og-image.png");

console.log("✅ Created og-image.png (1200x630)");
