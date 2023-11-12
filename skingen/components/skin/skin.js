const fs = require("fs").promises;
const path = require("path");

const SkinComponent = {
  assets: {}, // Object to store loaded assets

  placement: () => [{ part: "head", side: "front" }],

  getAsset: (id) => {
    const assetKey = `skintone_${id}`;
    return SkinComponent.assets[assetKey];
  },

  loadAssets: async () => {
    const assetsDir = path.resolve(__dirname, "./assets/");
    try {
      const files = await fs.readdir(assetsDir);
      for (const file of files) {
        if (file.startsWith("skintone_") && file.endsWith(".png")) {
          const filePath = path.join(assetsDir, file);
          const assetKey = path.basename(file, ".png");
          SkinComponent.assets[assetKey] = await fs.readFile(filePath);
        }
      }
      console.log("SkinComponent assets loaded successfully.");
    } catch (error) {
      console.error("Error loading SkinComponent assets:", error.message);
    }
  },

  applyToSkin: async (skinImage, id, color, placement, coordinates) => {
    try {
      const asset = SkinComponent.getAsset(id);
      if (!asset) {
        console.error(`Asset not found for Skin ID: ${id}`);
        return skinImage.png();
      }

      return skinImage.composite([
        {
          input: asset,
          left: 0,
          top: 0,
        },
      ]);
    } catch (error) {
      console.error(
        `Error applying Skin component (ID: ${id}) to skin: ${error.message}`
      );
      console.error("Asset path:", SkinComponent.getAsset(id));
      console.error("Coordinates:", coordinates);
      return skinImage.png();
    }
  },
};

// Load assets on initialization
SkinComponent.loadAssets();

module.exports = SkinComponent;
