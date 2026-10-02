const express = require("express");

const router = express.Router();

const {
  createTransaction,
  getTransactions,
  getTransactionById,
} = require("../controllers/transactionController");

router.get("/", getTransactions);

router.get("/:id", getTransactionById);

router.post("/", createTransaction);

module.exports = router;
