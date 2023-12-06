const fs = require("fs").promises;
const path = require("path");

const EyesComponent = {
  assets: {}, // Object to store loaded assets

  placement: () => [{ part: "head", side: "front" }],

  getAsset: (id, color) => {
    const assetKey = `eyes_${id}_${color}`;
    return EyesComponent.assets[assetKey];
  },

  loadAssets: async () => {
    const assetsDir = path.resolve(__dirname, "./assets/");
    try {
      const files = await fs.readdir(assetsDir);
      for (const file of files) {
        if (file.endsWith(".png")) {
          const filePath = path.join(assetsDir, file);
          const assetKey = path.basename(file, ".png");
          EyesComponent.assets[assetKey] = await fs.readFile(filePath);
        }
      }
    } catch (error) {
      console.error("Error loading assets:", error.message);
    }
  },

  applyToSkin: async (skinImage, id, color, placement, coordinates) => {
    try {
      const asset = EyesComponent.getAsset(id, color);
      if (!asset) {
        console.error(`Asset not found for ID: ${id}, Color: ${color}`);
        return skinImage.png();
      }

      return skinImage.composite([
        {
          input: asset,
          left: coordinates.x1,
          top: coordinates.y1,
        },
      ]);
    } catch (error) {
      console.error(
        `Error applying Eyes component (ID: ${id}) to skin: ${error.message}`
      );
      console.error("Asset path:", EyesComponent.getAsset(id));
      console.error("Coordinates:", coordinates);
      return skinImage.png();
    }
  },
};

// Load assets on initialization
EyesComponent.loadAssets();

module.exports = EyesComponent;
