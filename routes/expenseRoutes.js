const express = require("express");

const router = express.Router();

const {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");

// GET semua pengeluaran
router.get("/", getExpenses);

// GET detail
router.get("/:id", getExpenseById);

// POST tambah
router.post("/", createExpense);

// PUT edit
router.put("/:id", updateExpense);

// DELETE
router.delete("/:id", deleteExpense);

module.exports = router;
