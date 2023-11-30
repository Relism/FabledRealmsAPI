const express = require("express");
const bodyParser = require("body-parser");
const db = require("./database/db");

const skingen = require("./components/skingen.js");
const branchController = require("./components/branchController.js");

const app = express();
const port = 3000;

const MineSkinBearer = process.env.MINESKINKEY;

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
app.use("/", branchController);
app.use("/skingen", skingen);

app.get("/", async (req, res) => {
  res.send("Working!");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
