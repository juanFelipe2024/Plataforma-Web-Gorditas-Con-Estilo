require("dotenv").config();
const { MongoClient } = require("mongodb");

let db;
let client;

const connectDB = async () => {
  try {
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    db = client.db(); // toma el nombre de la URI
    console.log("MongoDB conectado (driver nativo)");
  } catch (error) {
    console.error("Error conectando a MongoDB:", error);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) throw new Error("Base de datos no inicializada");
  return db;
};

module.exports = { connectDB, getDB };
