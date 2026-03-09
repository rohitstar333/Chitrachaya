const sharp = require('sharp');

async function generateIcons() {
    const imagePath = "C:\\Users\\vsnsr\\OneDrive\\Desktop\\chitrachaya logo.jpeg";

    try {
        await sharp(imagePath)
            .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
            .toFile("public/icon-192x192.png");
        console.log("Generated 192x192 icon.");

        await sharp(imagePath)
            .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
            .toFile("public/icon-512x512.png");
        console.log("Generated 512x512 icon.");

    } catch (err) {
        console.error("Error generating icons:", err);
    }
}

generateIcons();
