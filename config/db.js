// const mysql = require("mysql2/promise");
// require("dotenv").config();

// const pool = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// });

// const connectDB = async () => {
//   try {
//     await pool.getConnection();
//     console.log("Connected to the database");
//   } catch (error) {
//     console.error("Database connection failed:", error);
//     process.exit(1);
//   }
// };

// const endConnection = async () => {
//   try {
//     await pool.end();
//     console.log("Database connection closed");
//   } catch (error) {
//     console.error("Error closing the database connection:", error);
//   }
// };

// module.exports = { pool, connectDB, endConnection };

const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const createMaterialsTable = async () => {
  const createMaterialsTableQuery = `
        CREATE TABLE IF NOT EXISTS material (
            material_id INT AUTO_INCREMENT PRIMARY KEY,
            material_name VARCHAR(255) NOT NULL
        );
    `;

  try {
    const [results, fields] = await pool.execute(createMaterialsTableQuery);
    console.log('Table "materials" ensured to exist');
  } catch (error) {
    console.error("Error creating materials table:", error);
  }
};

const createCategoriesTable = async () => {
  const createCategoriesTableQuery = `
        CREATE TABLE IF NOT EXISTS category (
            category_id INT AUTO_INCREMENT PRIMARY KEY,
            category_name VARCHAR(255) NOT NULL
        );
    `;

  try {
    const [results, fields] = await pool.execute(createCategoriesTableQuery);
    console.log('Table "categories" ensured to exist');
  } catch (error) {
    console.error("Error creating categories table:", error);
  }
};

const createProductsTable = async () => {
  const createProductsTableQuery = `
        CREATE TABLE IF NOT EXISTS product (
            product_id INT AUTO_INCREMENT PRIMARY KEY,
            SKU VARCHAR(255) NOT NULL,
            product_name VARCHAR(255) NOT NULL,
            category_id INT,
            price DECIMAL(10, 2) NOT NULL,
            FOREIGN KEY (category_id) REFERENCES category(category_id)
        );
  `;

  try {
    const [results, fields] = await pool.execute(createProductsTableQuery);
    console.log('Table "products" ensured to exist');
  } catch (error) {
    console.error("Error creating products table:", error);
  }
};

const createProductMaterialTable = async () => {
  const createProductMaterialTableQuery = `
            CREATE TABLE IF NOT EXISTS product_material (
                product_id INT,
                material_id INT,
                PRIMARY KEY (product_id, material_id),
                FOREIGN KEY (product_id) REFERENCES product(product_id),
                FOREIGN KEY (material_id) REFERENCES material(material_id)
            );
        `;

  try {
    const [results, fields] = await pool.execute(
      createProductMaterialTableQuery
    );
    console.log('Table "product_material" ensured to exist');
  } catch (error) {
    console.error("Error creating product_material table:", error);
  }
};

const createProductMediaTable = async () => {
  const createProductMediaTableQuery = `
            CREATE TABLE IF NOT EXISTS product_media (
                media_id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT,
                url VARCHAR(255),
                FOREIGN KEY (product_id) REFERENCES product(product_id)
            );
      `;

  try {
    const [results, fields] = await pool.execute(createProductMediaTableQuery);
    console.log('Table "product_media" ensured to exist');
  } catch (error) {
    console.error("Error creating product_media table:", error);
  }
};

// Check the connection and initialize tables
const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection(); // Get a connection from the pool
    console.log("Connected to MySQL as id " + connection.threadId);

    // Create the tables if they don't exist
    await createMaterialsTable();
    await createCategoriesTable();
    await createProductsTable();
    await createProductMaterialTable();
    await createProductMediaTable();

    // Release the connection back to the pool
    connection.release();
  } catch (error) {
    console.error("Error connecting to MySQL:", error);
    process.exit(1);
  }
};

module.exports = { pool, initializeDatabase };
