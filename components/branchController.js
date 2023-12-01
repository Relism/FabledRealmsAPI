const express = require("express");
const multer = require("multer");
const request = require("request"); // Make sure to install this module if you haven't already

const router = express.Router();

// Define an array of branches, each with its endpoint and token
const branches = [
  {
    name: "prod",
    endpoint: "http://prod-endpoint.com/upload",
    token: "lcVStqh0easd22trI4WQRdVF",
  },
  {
    name: "dev",
    endpoint: "http://129.152.5.2:4001/upload",
    token: "Wk6Owy1j72CX8RAzJYPSyDRy",
  },
  // Add more branches as needed
];

// Middleware to protect the upload route with a bearer token
router.use("/builds/:branch/upload", (req, res, next) => {
  const branchName = req.params.branch;
  const authToken = req.query.token;

  const branch = branches.find((branch) => branch.name === branchName);

  if (branch) {
    const expectedToken = branch.token;

    if (authToken === expectedToken) {
      // Authorization is successful; proceed to the next middleware
      next();
    } else {
      res.status(401).json({ error: "Unauthorized. Invalid bearer token." });
    }
  } else {
    res.status(400).json({ error: `Invalid branch: ${branchName}` });
  }
});

// POST route for forwarding the file without saving it
router.post("/builds/:branch/upload", multer().single("file"), (req, res) => {
  const branchName = req.params.branch;

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const branch = branches.find((branch) => branch.name === branchName);

  if (branch) {
    const endpoint = branch.endpoint;
    const formData = {
      file: {
        value: req.file.buffer,
        options: {
          filename: req.file.originalname,
        },
      },
    };

    request.post(
      {
        url: endpoint,
        formData: formData,
      },
      (error, response, body) => {
        if (error) {
          console.error(`Failed to forward file to ${endpoint}: ${error}`);
          res.status(500).json({
            error: `Failed to forward file to ${branchName} endpoint : ${error}`,
          });
        } else {
          console.log(`File forwarded to ${branchName} endpoint: ${endpoint}`);
          res.json({
            message: `File uploaded and forwarded to ${branchName} endpoint successfully : ${response}`,
          });
        }
      },
    );
  } else {
    res.status(400).json({ error: `Invalid branch: ${branchName}` });
  }
});

module.exports = router;
