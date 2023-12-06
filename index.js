const express = require("express");
const bodyParser = require("body-parser");
const path = require('path');

const viewsConfigurations = require("./views/configurations.js");
const skingen = require("./components/skingen.js");
const webhooks = require("./components/webhooks.js")
const branchController = require("./components/branchController.js");

const app = express();
const port = 3000;
const runtimeVersion = getApiRuntimeVersion();
const db = require("./database/db");

const skinComponents = {
  skin: require("./components/skingen/skinComponents/skin/skin.js"),
  shirt: require("./components/skingen/skinComponents/shirt/shirt.js"),
  ears: require("./components/skingen/skinComponents/ears/ears.js"),
  eyes: require("./components/skingen/skinComponents/eyes/eyes.js"),
};

async function init() {
  try {
    await db.connect();
    initSkinComponents();
  } catch (error) {
    console.error("Initialization error : ", error);
  }
}

init();

const initSkinComponents = async () => {
  let loaded = 0;
  let skinComponentsAmount = Object.keys(skinComponents).length;
  for (const componentName in skinComponents) {
    if (Object.prototype.hasOwnProperty.call(skinComponents, componentName)) {
      const component = skinComponents[componentName];

      if (component && typeof component.loadAssets === "function") {
        await component.loadAssets();
        loaded++
        //console.log(`${componentName} component assets loaded successfully.`);
      } else {
        console.error(`Error loading assets for ${componentName} component.`);
      }
    }
  } if (loaded == skinComponentsAmount){
    console.log("All " + skinComponentsAmount + " skin components were loaded succesfully!")
  }
};

function getApiRuntimeVersion() {
  const currentDate = new Date();

  const year = currentDate.getFullYear().toString().slice(-2);;
  const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Two digits, zero-padded
  const day = String(currentDate.getDate()).padStart(2, '0');
  const hour = String(currentDate.getHours()).padStart(2, '0');
  const minute = String(currentDate.getMinutes()).padStart(2, '0');

  return `${year}${day}${month}${hour}${minute}`;
}

app.use(bodyParser.json());
app.use("/", branchController);
app.use("/skingen", skingen);
app.use("/webhooks", webhooks);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', async (req, res) => {
  const particlesConfiguration = viewsConfigurations.particlesConfiguration;
  res.render('root', { particlesConfiguration, runtimeVersion }); // Assuming runtimeVersion is available in your scope
});

app.listen(port, () => {
  console.log(`Server is running on port : ${port}`);
});
