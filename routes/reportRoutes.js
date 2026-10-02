const express = require("express");

const router = express.Router();

const {
  getSalesReport,
  getSalesByProduct,
  getFinancialReport,
} = require("../controllers/reportController");

// Ringkasan laporan penjualan
router.get("/sales", getSalesReport);

// Penjualan berdasarkan menu
router.get("/sales-by-product", getSalesByProduct);

// Laporan keuangan / laba rugi
router.get("/financial", getFinancialReport);

module.exports = router;
