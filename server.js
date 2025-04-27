const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const productRoutes = require("./routes/productRoutes");
const dotenv = require("dotenv");
const { initializeDatabase } = require("./config/db");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the Product Management API!");
});

app.use("/api/products", productRoutes);
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/materials", require("./routes/materialRoutes"));

app.listen(PORT, async () => {
  try {
    // Initialize the database when the server starts
    await initializeDatabase();

    console.log(`Server is running on port ${PORT}`);
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
});

module.exports = app;
