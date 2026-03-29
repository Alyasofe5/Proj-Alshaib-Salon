import sharp from "sharp";

// Read the original logo
const logo = sharp("public/images/logo_new.png");

// Create a square version with BLACK background (512x512)
await sharp("public/images/logo_new.png")
  .resize(512, 512, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 1 } // Black background
  })
  .sharpen()
  .png({ quality: 100, compressionLevel: 6 })
  .toFile("public/images/logo_black_bg.png");

console.log("✅ Created logo_black_bg.png (512x512 with black background)");

// Also create high-res version (1024x1024)
await sharp("public/images/logo_new.png")
  .resize(1024, 1024, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 1 } // Black background
  })
  .sharpen()
  .png({ quality: 100, compressionLevel: 6 })
  .toFile("public/images/logo_black_bg_hd.png");

console.log("✅ Created logo_black_bg_hd.png (1024x1024 with black background)");
