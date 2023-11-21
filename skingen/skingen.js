const sharp = require("sharp");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

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

async function getPlayerAvatar(uuid, size) {
  const canvas = createCanvas(20, 20);
  const ctx = canvas.getContext("2d");

  const dbClient = db.getClient();
  const database = dbClient.db("player");

  // Use uuid directly as the collection name
  const playerCol = database.collection(uuid);
  const skinDocument = await playerCol.findOne({ type: "skin" });

  if (
    skinDocument &&
    skinDocument.skinData &&
    skinDocument.skinData.texture &&
    skinDocument.skinData.texture.url
  ) {
    const skinImageUrl = skinDocument.skinData.texture.url;
    await generatePfp(skinImageUrl, ctx, size);
  } else {
    console.log(
      `No document found for player ${uuid} with type "skin" or missing required field`,
    );
  }

  const resizedCanvas = resizeCanvas(canvas, size, size);
  const resizedCtx = resizedCanvas.getContext("2d");

  const backdrop = await loadImage(
    "./skingen/components/static/backdropshading.png",
  );

  // Apply backdrop shading after resizing
  resizedCtx.drawImage(backdrop, 0, 0, size, size);

  return resizedCanvas.toBuffer();
}

async function generatePfp(imageUrl, ctx) {
  try {
    const skinImage = await downloadImage(imageUrl);

    if (!skinImage) {
      console.error("Error downloading image.");
      drawFailed(ctx);
      return;
    }

    const shading = await loadImage(
      "./skingen/components/static/20x20pshading.png",
    );

    const canvasWidth = 20;
    const canvasHeight = 20;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (skinImage.height === 32) {
      ctx.drawImage(skinImage, 8, 9, 7, 7, 8, 4, 7, 7); // Head (bottom layer)
      ctx.drawImage(skinImage, 5, 9, 3, 7, 5, 4, 3, 7); // Head Side (bottom layer)
      ctx.drawImage(skinImage, 44, 20, 3, 7, 12, 13, 3, 7); // Arm Right Side (bottom layer)
      ctx.drawImage(skinImage, 21, 20, 6, 1, 7, 11, 6, 1); // Chest Neck Small Line (bottom layer)
      ctx.drawImage(skinImage, 20, 21, 8, 8, 6, 12, 8, 8); // Chest Other (Bottom layer)
      ctx.drawImage(skinImage, 44, 20, 3, 7, 5, 13, 3, 7); // Arm Left Side (bottom layer)
      ctx.drawImage(skinImage, 40, 9, 7, 7, 8, 4, 7, 7); // Head (top layer)
      ctx.drawImage(skinImage, 33, 9, 3, 7, 5, 4, 3, 7); // Head Side (top layer)
    } else {
      // * BOTTOM LAYER
      ctx.drawImage(skinImage, 8, 9, 7, 7, 8, 4, 7, 7); // Head (bottom layer)
      ctx.drawImage(skinImage, 5, 9, 3, 7, 5, 4, 3, 7); // Head Side (bottom layer)
      ctx.drawImage(skinImage, 36, 52, 3, 7, 12, 13, 3, 7); // Arm Right Side (bottom layer)
      ctx.drawImage(skinImage, 21, 20, 6, 1, 7, 11, 6, 1); // Chest Neck Small Line (bottom layer)
      ctx.drawImage(skinImage, 20, 21, 8, 8, 6, 12, 8, 8); // Chest Other (Bottom layer)
      ctx.drawImage(skinImage, 44, 20, 3, 7, 5, 13, 3, 7); // Arm Left Side (bottom layer)

      // * TOP LAYER
      ctx.drawImage(skinImage, 40, 9, 7, 7, 8, 4, 7, 7); // Head (top layer)
      ctx.drawImage(skinImage, 33, 9, 3, 7, 5, 4, 3, 7); // Head Side (top layer)
      ctx.drawImage(skinImage, 52, 52, 3, 7, 12, 13, 3, 7); // Arm Right Side (top layer)
      ctx.drawImage(skinImage, 52, 36, 3, 7, 5, 13, 3, 7); // Arm Left Side (top layer)
      ctx.drawImage(skinImage, 20, 37, 8, 8, 6, 12, 8, 8); // Chest Other (top layer)
      ctx.drawImage(skinImage, 21, 36, 6, 1, 7, 11, 6, 1); // Chest Neck Small Line (top layer)
    }

    ctx.drawImage(shading, 0, 0, canvasWidth, canvasHeight);
  } catch (e) {
    console.error(e);
    return e;
  }
}

function resizeCanvas(canvas, width, height) {
  const resizedCanvas = createCanvas(width, height);
  const resizedCtx = resizedCanvas.getContext("2d");
  resizedCtx.imageSmoothingEnabled = false; // Use nearest-neighbor algorithm
  resizedCtx.drawImage(canvas, 0, 0, width, height);
  return resizedCanvas;
}

async function downloadImage(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const image = await loadImage(Buffer.from(response.data, "binary"));
    return image;
  } catch (error) {
    console.error("Error downloading image:", error);
    return null;
  }
}

async function drawFailed(ctx) {
  try {
    const failed = await loadImage("./skingen/components/static/notFound.png");
    const shading = await loadImage("./components/static/20x20pshading.png");
    const backdrop = await loadImage("./components/static/backdropshading.png");

    const canvasWidth = 18;
    const canvasHeight = 18;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(backdrop, 0, 0, canvasWidth, canvasHeight);
    ctx.resetTransform();
    ctx.drawImage(failed, 0, 0, 18, 18);
    ctx.scale(16, 16);
    ctx.drawImage(shading, 0, 0, canvasWidth, canvasHeight);
  } catch (e) {
    console.error(e);
  }
}

async function resizeImageToCanvas(imagePath, width, height) {
  const originalImage = await loadImage(imagePath);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(originalImage, 0, 0, width, height);
  return canvas;
}

async function setSkinConfig(uuid, config, mskindata) {
  const dbClient = db.getClient();
  const database = dbClient.db("player");
  const playerCol = database.collection(uuid);

  try {
    const query = { type: "skin" };
    const updates = [
      { $set: { skinConfiguration: config } },
      { $set: { skinData: mskindata } },
    ];

    let results = 0;

    for (const update of updates) {
      const result = await playerCol.updateOne(query, update);
      results += result.matchedCount;
    }

    if (results === updates.length) {
      console.log(`Skin configuration updated for player ${uuid}`);
    } else if (results > 0) {
      console.log(`Some updates were applied, but not all for player ${uuid}`);
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
  setSkinConfig: setSkinConfig,
  getPlayerAvatar: getPlayerAvatar,
};
