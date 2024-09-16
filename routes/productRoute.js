const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const multer = require("multer");
const path = require("path");
const upload = require("../middleware/multerConfig");

// Route to add a new product
router.post("/add-product", upload.single("image"), async (req, res) => {
  try {
    const { productName, productDescription, price, productType } = req.body;

    // Check if the image is uploaded successfully
    if (!req.file) {
      return res.status(400).json({ error: "Image upload failed" });
    }

    const newProduct = new Product({
      productName,
      productDescription,
      price,
      productType,
      productImage: req.file.path, // Save the image path to the database
    });

    const savedProduct = await newProduct.save();
    res
      .status(201)
      .json({ message: "Product added successfully", product: savedProduct });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to add product", message: error.message });
  }
});

// Route to get all products
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch products", message: error.message });
  }
});

// Route to get a single product by ID
router.get("/product/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch product", message: error.message });
  }
});

module.exports = router;
