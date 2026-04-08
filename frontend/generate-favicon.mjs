import sharp from "sharp";
import { readFileSync } from "fs";

// Configuration for high-quality PWA icons
const sizes = [192, 512, 180]; // Standard PWA sizes
const outputFiles = ["public/icon-192.png", "public/icon-512.png", "public/apple-touch-icon.png"];

// Load the source logo
const logoBuffer = readFileSync("public/images/logo_new.png");

async function generateIcons() {
  try {
    for (let i = 0; i < sizes.length; i++) {
        const size = sizes[i];
        const outputFile = outputFiles[i];

        // 1. Create a solid black background
        const blackBg = await sharp({
            create: {
                width: size,
                height: size,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 1 }
            }
        }).png().toBuffer();

        // 2. Prepare the LOGO
        // Safe size for splash screen (centered with breathing room)
        const logoSize = Math.floor(size * 0.75); 
        
        // Creative "Neon Bloom" Effect:
        // Create a blurred lime-tinted version of the logo to act as a glow
        // Using Maqass Lime: #C3D809 (r: 195, g: 216, b: 9)
        const glowBuffer = await sharp(logoBuffer)
            .resize(logoSize, logoSize, { fit: "contain" })
            .tint({ r: 195, g: 216, b: 9 })
            .blur(size * 0.05) 
            .toBuffer();

        const logoResized = await sharp(logoBuffer)
            .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toBuffer();

        // 3. Composite everything together
        await sharp(blackBg)
            .composite([
                { input: glowBuffer, gravity: "center", blend: "screen" },
                { input: logoResized, gravity: "center" }
            ])
            .png()
            .toFile(outputFile);

        // Also save for app/icon.png (Next.js favicon)
        if (size === 512) {
            await sharp(blackBg)
                .composite([
                    { input: glowBuffer, gravity: "center", blend: "screen" },
                    { input: logoResized, gravity: "center" }
                ])
                .png()
                .toFile("app/icon.png");
        }
    }
    
    console.log("✅ Icons (PWA & Favicon) generated successfully with premium NEON BLOOM look!");
  } catch (error) {
    console.error("❌ Error generating icons:", error);
  }
}

generateIcons();
