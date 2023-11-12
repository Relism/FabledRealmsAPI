const fs = require("fs").promises;
const path = require("path");
const sharp = require("sharp");

const EarsComponent = {
  assets: {}, // Object to store loaded assets

  placement: () => [
    { part: "head", side: "right" },
    { part: "head", side: "left" },
  ],

  getAsset: (id, color) => {
    const assetKey = `ears_${id}_${color}`;
    return EarsComponent.assets[assetKey];
  },

  loadAssets: async () => {
    const assetsDir = path.resolve(__dirname, "./assets/");
    try {
      const files = await fs.readdir(assetsDir);
      for (const file of files) {
        if (file.startsWith("ears_") && file.endsWith(".png")) {
          const filePath = path.join(assetsDir, file);
          const assetKey = path.basename(file, ".png");
          EarsComponent.assets[assetKey] = await fs.readFile(filePath);
        }
      }
      console.log("EarsComponent assets loaded successfully.");
    } catch (error) {
      console.error("Error loading EarsComponent assets:", error.message);
    }
  },

  applyToSkin: async (skinImage, id, color, placement, coordinates) => {
    try {
      const asset = EarsComponent.getAsset(id, color);
      if (!asset) {
        console.error(`Asset not found for Ears ID: ${id}`);
        return skinImage.png();
      }

      const flippedEarsBuffer =
        placement.side === "left"
          ? await sharp(asset).flop().toBuffer()
          : asset;

      return skinImage.composite([
        {
          input: flippedEarsBuffer,
          left: coordinates.x1,
          top: coordinates.y1,
        },
      ]);
    } catch (error) {
      console.error(
        `Error applying Ears component (ID: ${id}) to skin: ${error.message}`,
      );
      console.error("Asset path:", EarsComponent.getAsset(id));
      console.error("Coordinates:", coordinates);
      return skinImage.png();
    }
  },
};

// Load assets on initialization
EarsComponent.loadAssets();

module.exports = EarsComponent;
