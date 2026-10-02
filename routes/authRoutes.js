const express = require("express");

const router = express.Router();

const {
  login,
  registerCashier,
  registerOwner,
} = require("../controllers/authController");

// Login
router.post("/login", login);

// Register cashier
router.post("/register-cashier", registerCashier);

// Register owner
router.post("/register", registerOwner);
router.post("/register-cashier", registerCashier);

module.exports = router;
