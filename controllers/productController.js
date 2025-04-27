const { pool } = require("../config/db");
const { encrypt, decrypt } = require("../utils/encryption");

// Get all products
const getProducts = async (req, res) => {
  const getProductsQuery = `
    SELECT 
      product.product_id, 
      product.SKU, 
      product.product_name, 
      category.category_name, 
      product.price, 
      GROUP_CONCAT(DISTINCT material.material_name) AS materials,
      GROUP_CONCAT(DISTINCT product_media.url) AS image_urls  
    FROM product
    JOIN category ON product.category_id = category.category_id
    LEFT JOIN product_material ON product.product_id = product_material.product_id
    LEFT JOIN material ON product_material.material_id = material.material_id
    LEFT JOIN product_media ON product.product_id = product_media.product_id  
    GROUP BY product.product_id, category.category_name
  `;

  try {
    // Execute the query using pool directly
    const [rows] = await pool.execute(getProductsQuery);

    // Decrypt SKU for each product in the result
    const decryptedProducts = rows.map((product) => ({
      ...product,
      SKU: decrypt(product.SKU), // Decrypt SKU before returning
    }));

    // Send the decrypted product data in response
    res.status(200).json(decryptedProducts);
  } catch (error) {
    console.error("Error getting products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params; // Product ID to fetch
  const getProductByIdQuery = `
    SELECT 
      product.product_id, 
      product.SKU, 
      product.product_name, 
      product.category_id,
      category.category_name, 
      product.price, 
      GROUP_CONCAT(DISTINCT material.material_id) AS materials,
      GROUP_CONCAT(DISTINCT product_media.url) AS image_urls  
    FROM product
    JOIN category ON product.category_id = category.category_id
    LEFT JOIN product_material ON product.product_id = product_material.product_id
    LEFT JOIN material ON product_material.material_id = material.material_id
    LEFT JOIN product_media ON product.product_id = product_media.product_id  
    WHERE product.product_id = ?
    GROUP BY product.product_id, category.category_name
  `;
  try {
    // Execute the query using pool directly

    const [rows] = await pool.execute(getProductByIdQuery, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    // Decrypt SKU for the product
    const product = {
      ...rows[0],
      SKU: decrypt(rows[0].SKU), // Decrypt SKU before returning
    };
    // Send the decrypted product data in response
    res.status(200).json(product);
  } catch (error) {
    console.error("Error getting product by ID:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Add a new product
const addProduct = async (req, res) => {
  const { SKU, product_name, category_id, price, materials, image_urls } =
    req.body;

  // Validate request body
  if (
    !SKU ||
    !product_name ||
    !category_id ||
    !price ||
    !materials ||
    !image_urls
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Get a connection from the pool
  const connection = await pool.getConnection();

  try {
    // Encrypt SKU
    const encryptedSKU = encrypt(SKU);

    // Start a transaction using the connection
    await connection.beginTransaction();

    // Check if SKU already exists in the database
    const [existingProduct] = await connection.execute(
      "SELECT product_id FROM product WHERE SKU = ?",
      [encryptedSKU]
    );

    if (existingProduct.length > 0) {
      // Rollback if the SKU already exists
      await connection.rollback();
      return res.status(409).json({ error: "Duplicate SKU is not allowed" });
    }

    // 1. Insert the new product into the products table
    const [productResult] = await connection.execute(
      "INSERT INTO product (SKU, product_name, category_id, price) VALUES (?, ?, ?, ?)",
      [encryptedSKU, product_name, category_id, price]
    );

    const product_id = productResult.insertId; // Get the newly created product_id

    // 2. Insert associated materials into the product_material table
    for (const material_id of materials) {
      await connection.execute(
        "INSERT INTO product_material (product_id, material_id) VALUES (?, ?)",
        [product_id, material_id]
      );
    }

    // 3. Insert the image URL into the product_media table if available
    // Insert image URLs into the product_media table
    for (const imageUrl of image_urls) {
      await connection.execute(
        "INSERT INTO product_media (product_id, url) VALUES (?, ?)",
        [product_id, imageUrl]
      );
    }
    // Commit the transaction
    await connection.commit();

    // Release the connection back to the pool even if there is an error
    connection.release();

    res
      .status(201)
      .json({ message: "Product and materials added successfully" });
  } catch (error) {
    await connection.rollback(); // Rollback in case of error
    console.error("Error adding product and materials:", error);

    // Release the connection back to the pool even if there is an error
    connection.release();

    res.status(500).json({ message: "Server error" });
  }
};

// Edit a product by ID
const editProduct = async (req, res) => {
  const { id } = req.params; // Product ID to update
  const { SKU, product_name, category_id, price, materials, image_urls } =
    req.body; // New data

  // Validate request body
  if (
    !SKU ||
    !product_name ||
    !category_id ||
    !price ||
    !materials ||
    !image_urls
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Get a connection from the pool
  const connection = await pool.getConnection();

  try {
    const encryptedSKU = encrypt(SKU);

    // Start a transaction to ensure the integrity of editing the product and its materials
    await connection.beginTransaction();

    // Check if SKU already exists in another product
    const [existingProduct] = await connection.execute(
      "SELECT product_id FROM product WHERE SKU = ? AND product_id != ?",
      [encryptedSKU, id]
    );

    if (existingProduct.length > 0) {
      return res.status(409).json({ error: "Duplicate SKU is not allowed" });
    }

    // 1. Update the product in the products table
    await connection.execute(
      "UPDATE product SET SKU = ?, product_name = ?, category_id = ?, price = ? WHERE product_id = ?",
      [encryptedSKU, product_name, category_id, price, id]
    );

    // 2. Remove old product-material associations
    await connection.execute(
      "DELETE FROM product_material WHERE product_id = ?",
      [id]
    );

    // 3. Add the new product-material associations
    for (const material_id of materials) {
      await connection.execute(
        "INSERT INTO product_material (product_id, material_id) VALUES (?, ?)",
        [id, material_id]
      );
    }

    // 4. Remove old product media
    await connection.execute("DELETE FROM product_media WHERE product_id = ?", [
      id,
    ]);

    // 5. Add new product media
    for (const imageUrl of image_urls) {
      await connection.execute(
        "INSERT INTO product_media (product_id, url) VALUES (?, ?)",
        [id, imageUrl]
      );
    }

    // Commit the transaction
    await connection.commit();

    // Release the connection back to the pool even if there is an error
    connection.release();

    res
      .status(200)
      .json({ message: "Product and materials updated successfully" });
  } catch (error) {
    await connection.rollback(); // Rollback in case of error
    console.error("Error updating product and materials:", error);

    // Release the connection back to the pool even if there is an error
    connection.release();

    res.status(500).json({ message: "Server error" });
  }
};

// Delete a product by ID
const deleteProduct = async (req, res) => {
  const { id } = req.params; // Product ID to delete

  const connection = await pool.getConnection();
  try {
    // Start a transaction to ensure the integrity of deleting the product and its material associations
    await connection.beginTransaction();

    // Delete product media and materials
    await connection.execute("DELETE FROM product_media WHERE product_id = ?", [
      id,
    ]);

    await connection.execute(
      "DELETE FROM product_material WHERE product_id = ?",
      [id]
    );

    // Delete the product
    await connection.execute("DELETE FROM product WHERE product_id = ?", [id]);

    // Commit the transaction
    await connection.commit();

    // Release the connection back to the pool even if there is an error
    connection.release();

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    await connection.rollback(); // Rollback in case of error
    console.error("Error deleting product and its materials:", error);

    // Release the connection back to the pool even if there is an error
    connection.release();

    res.status(500).json({ message: "Server error" });
  }
};

const getCategoryHighestPrice = async (req, res) => {
  const query = `
      SELECT category.category_name, MAX(product.price) AS highest_price
      FROM product
      JOIN category ON product.category_id = category.category_id
      GROUP BY category.category_name;
    `;

  try {
    const [rows] = await pool.execute(query);
    res.status(200).json(rows); // Return the highest price for each category
  } catch (error) {
    console.error("Error getting highest price by category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getPriceRangeCount = async (req, res) => {
  const query = `
      SELECT 
        CASE
          WHEN price <= 500 THEN '0-500'
          WHEN price BETWEEN 501 AND 1000 THEN '501-1000'
          WHEN price > 1000 THEN '1000+'
        END AS price_range,
        COUNT(*) AS product_count
      FROM product
      GROUP BY price_range;
    `;

  try {
    const [rows] = await pool.execute(query);
    res.status(200).json(rows); // Return product counts for each price range
  } catch (error) {
    console.error("Error getting price range count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getNoMediaProducts = async (req, res) => {
  const query = `
      SELECT product.product_id, product.product_name
      FROM product
      LEFT JOIN product_media ON product.product_id = product_media.product_id
      WHERE product_media.product_id IS NULL;
    `;

  try {
    const [rows] = await pool.execute(query);
    res.status(200).json(rows); // Return products without media
  } catch (error) {
    console.error("Error getting products with no media:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getProducts,
  getProductById,
  addProduct,
  editProduct,
  deleteProduct,
  getCategoryHighestPrice,
  getPriceRangeCount,
  getNoMediaProducts,
};
