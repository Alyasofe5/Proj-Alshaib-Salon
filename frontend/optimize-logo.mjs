import sharp from "sharp";

// Read the original logo
const logo = sharp("public/images/logo_new.png");
const metadata = await logo.metadata();

console.log("Original dimensions:", metadata.width, "x", metadata.height);

// Create a square canvas (use the larger dimension)
const size = Math.max(metadata.width, metadata.height);

// Create optimized versions for different uses
// 1. High-res square version for web display (1024x1024)
await sharp("public/images/logo_new.png")
  .resize(1024, 1024, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
  .sharpen()
  .png({ quality: 100, compressionLevel: 6 })
  .toFile("public/images/logo_optimized.png");

console.log("✅ Created logo_optimized.png (1024x1024)");

// 2. Medium version for general use (512x512)
await sharp("public/images/logo_new.png")
  .resize(512, 512, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
  .sharpen()
  .png({ quality: 100, compressionLevel: 6 })
  .toFile("public/images/logo_medium.png");

console.log("✅ Created logo_medium.png (512x512)");
