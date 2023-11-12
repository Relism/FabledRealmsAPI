const fs = require("fs").promises;
const sharp = require("sharp");

const { skinPartSides } = require("./constants");
const db = require("../database/db");

const skinComponents = {
  skin: require("./components/skin/skin.js"),
  shirt: require("./components/shirt/shirt.js"),
  ears: require("./components/ears/ears.js"),
  eyes: require("./components/eyes/eyes.js"),
};

const generateSkin = async (config, uuid) => {
  try {
    console.log("Creating a new skin for : " + uuid);

    let skinImage = await sharp({
      create: {
        width: 64,
        height: 64,
        channels: 4,
        background: {
          r: 255,
          g: 255,
          b: 255,
          alpha: 0,
        },
      },
    });

    for (const [componentName, componentModule] of Object.entries(
      skinComponents,
    )) {
      if (
        componentName != null &&
        componentModule != null &&
        config[componentName] != null
      ) {
        console.log(`• Applying ${componentName}...`);
        const component = componentModule.default || componentModule; // handle ES6 module default export

        const placements = component.placement();

        for (const placement of placements) {
          const coordinates = skinPartSides[placement.part][placement.side];
          console.log(
            `   → setting ${componentName} to "${placement.part}:${placement.side}", coordinates:`,
            coordinates,
          );

          // Apply the component to the main skin image and get the updated image
          skinImage = await component.applyToSkin(
            skinImage,
            config[componentName].id,
            config[componentName].color,
            placement,
            coordinates,
          );

          // Convert the skinImage to a Buffer and save the intermediate image
          const intermediateImageBuffer = await skinImage.png().toBuffer();
          skinImage = await sharp(intermediateImageBuffer);
        }
      }
    }

    const finalImageBuffer = await skinImage.png().toBuffer();
    console.log("Skin generation complete!");

    return finalImageBuffer;
  } catch (error) {
    console.error("Error generating skin:", error.message);
  }
};

async function setConfig(uuid, config) {
  const dbClient = db.getClient();
  const database = dbClient.db("player");
  const playerCol = database.collection(uuid);

  try {
    const query = { type: "skin" };
    const update = { $set: { skinConfiguration: config } };

    const result = await playerCol.updateOne(query, update);

    if (result.matchedCount === 1) {
      console.log(`Skin configuration updated for player ${uuid}`);
    } else {
      console.log(`No document found for player ${uuid} with type "skin"`);
    }
  } catch (error) {
    console.error("Error updating skin configuration", error);
    throw error;
  }
}

module.exports = {
  generateSkin: generateSkin,
};
