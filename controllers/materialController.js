const { pool } = require("../config/db");

const getMaterials = async (req, res) => {
  try {
    const [results, fields] = await pool.execute("SELECT * FROM material");
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching materials:", error);
    res.status(500).json({ error: "Failed to fetch materials" });
  }
};

module.exports = {
  getMaterials,
};
