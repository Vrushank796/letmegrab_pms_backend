const express = require("express");
const router = express.Router();
const materialController = require("../controllers/materialController");

router.get("/", materialController.getMaterials);

module.exports = router;
