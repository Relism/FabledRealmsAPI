const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGOURI;

// Create a new MongoClient
const client = new MongoClient(uri);
let clientConnected = false;

async function connect() {
  try {
    // Connect to the MongoDB server
    await client.connect();
    clientConnected = true;
    console.log("Connected to the database");
  } catch (error) {
    console.error("Error connecting to the database", error);
    throw error;
  }
}

// Function to get the client instance
function getClient() {
  if (!clientConnected) {
    throw new Error("Database not connected");
  }
  return client;
}

// Function to close the database connection
async function close() {
  try {
    await client.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error closing the database connection", error);
    throw error;
  }
}

// Export the functions for external use
module.exports = {
  connect,
  getClient,
  close,
};
