const express = require("express");
const router = express.Router();
const skingen = require("../skingen/skingen.js");
const axios = require("axios");
const FormData = require("form-data");
require("dotenv").config();

const MineSkinBearer = process.env.MINESKINKEY

router.get("/generate/:uuid/:config", async (req, res) => {
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
    skingen.setSkinConfig(uuid, JSON.parse(config), response.data.data);
  } catch (error) {
    console.error("Error generating skin:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/avatar/:uuid/:size", async (req, res) => {
  try {
    const uuid = req.params.uuid;
    const size = parseInt(req.params.size) || 512; // Default to 512 if size is not provided or not a valid number

    const imageBuffer = await skingen.getPlayerAvatar(uuid, size);

    res.set("Content-Type", "image/png");
    res.send(imageBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.toString());
  }
});

module.exports = router;
