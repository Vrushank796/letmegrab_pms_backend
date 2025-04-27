const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);
router.post("/", productController.addProduct);
router.put("/:id", productController.editProduct);
router.delete("/:id", productController.deleteProduct);
router.get(
  "/statistics/highest-price",
  productController.getCategoryHighestPrice
);
router.get("/statistics/price-range", productController.getPriceRangeCount);
router.get("/statistics/no-media", productController.getNoMediaProducts);

module.exports = router;
