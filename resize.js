import Jimp from 'jimp';

async function generateIcons() {
    const imagePath = "C:\\Users\\vsnsr\\.gemini\\antigravity\\brain\\823b2a38-dff0-4aab-8182-e28302762693\\media__1772568489486.jpg";

    try {
        const originalImage = await Jimp.read(imagePath);

        // Create 512x512 icon
        const icon512 = originalImage.clone();
        await icon512.cover(512, 512).writeAsync("public/icon-512x512.png");
        console.log("Generated 512x512 icon.");

        // Create 192x192 icon
        const icon192 = originalImage.clone();
        await icon192.cover(192, 192).writeAsync("public/icon-192x192.png");
        console.log("Generated 192x192 icon.");

    } catch (err) {
        console.error("Error generating icons:", err);
    }
}

generateIcons();
