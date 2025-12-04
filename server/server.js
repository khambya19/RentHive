const express = require("express");
const { connection } = require("./config/database");
require("dotenv").config();

const app = express();
app.use(express.json());

connection();

app.get("/", (req, res) => {
  res.send("Renthive backend is running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
