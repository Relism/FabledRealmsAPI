const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const skingen = require("./skingen/skingen");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const db = require("./database/db");

const app = express();
const port = 3000;

const MineSkinBearer = process.env.MINESKINKEY;
//test commit

const skinComponents = {
  skin: require("./skingen/components/skin/skin.js"),
  shirt: require("./skingen/components/shirt/shirt.js"),
  ears: require("./skingen/components/ears/ears.js"),
  eyes: require("./skingen/components/eyes/eyes.js"),
};

async function init() {
  try {
    await db.connect();
    initComponents();
  } catch (error) {
    console.error("Initialization error : ", error);
  }
}

init();

const initComponents = async () => {
  for (const componentName in skinComponents) {
    if (Object.prototype.hasOwnProperty.call(skinComponents, componentName)) {
      const component = skinComponents[componentName];

      if (component && typeof component.loadAssets === "function") {
        await component.loadAssets();
        console.log(`${componentName} component assets loaded successfully.`);
      } else {
        console.error(`Error loading assets for ${componentName} component.`);
      }
    }
  }
};

app.use(bodyParser.json());

app.get("/", async (req, res) => {
  res.send("Working!");
});

app.get("/skingen/generate/:uuid/:config", async (req, res) => {
  try {
    const { uuid, config } = req.params;

    // Assuming skingen.generateSkin returns the image buffer directly
    const finalImageBuffer = await skingen.generateSkin(
      JSON.parse(config),
      uuid,
    );

    // Create FormData
    const formData = new FormData();
    formData.append("file", Buffer.from(finalImageBuffer), {
      filename: "final_skin.png",
      contentType: "image/png",
    });

    // Send request to MineSkin API
    const response = await axios.post(
      "https://api.mineskin.org/generate/upload",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: "Bearer " + MineSkinBearer,
        },
      },
    );

    // Send the generated skin URL to the client
    res.send(response.data.data.texture);
  } catch (error) {
    console.error("Error generating skin:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
