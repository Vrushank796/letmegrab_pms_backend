const { pool } = require("../config/db");

const getCategories = async (req, res) => {
  try {
    const [results, fields] = await pool.execute("SELECT * FROM category");
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

module.exports = {
  getCategories,
};
