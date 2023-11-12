const fs = require("fs").promises;
const path = require("path");

const ShirtComponent = {
  assets: {}, // Object to store loaded assets

  placement: () => [{ part: "head", side: "front" }],

  getAsset: (id, color) => {
    const assetKey = `shirt_${id}_${color}`;
    return ShirtComponent.assets[assetKey];
  },

  loadAssets: async () => {
    const assetsDir = path.resolve(__dirname, "./assets/");
    try {
      const files = await fs.readdir(assetsDir);
      for (const file of files) {
        if (file.startsWith("shirt_") && file.endsWith(".png")) {
          const filePath = path.join(assetsDir, file);
          const assetKey = path.basename(file, ".png");
          ShirtComponent.assets[assetKey] = await fs.readFile(filePath);
        }
      }
      console.log("ShirtComponent assets loaded successfully.");
    } catch (error) {
      console.error("Error loading ShirtComponent assets:", error.message);
    }
  },

  applyToSkin: async (ShirtImage, id, color, placement, coordinates) => {
    try {
      const asset = ShirtComponent.getAsset(id, color);
      if (!asset) {
        console.error(`Asset not found for Shirt ID: ${id}`);
        return ShirtImage.png();
      }

      return ShirtImage.composite([
        {
          input: asset,
          left: 0,
          top: 0,
        },
      ]);
    } catch (error) {
      console.error(
        `Error applying Shirt component (ID: ${id}) to Shirt: ${error.message}`,
      );
      console.error("Asset path:", ShirtComponent.getAsset(id));
      console.error("Coordinates:", coordinates);
      return ShirtImage.png();
    }
  },
};

// Load assets on initialization
ShirtComponent.loadAssets();

module.exports = ShirtComponent;
