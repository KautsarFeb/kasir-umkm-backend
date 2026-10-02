const pool = require("../config/database");

// =========================
// LOGIN
// =========================

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username dan password wajib diisi",
      });
    }

    const [rows] = await pool.query(
      `
            SELECT
              users.id,
              users.store_id,
              users.name,
              users.username,
              users.role,
                stores.name AS store_name
            FROM users
            JOIN stores
              ON stores.id = users.store_id
            WHERE username = ?
            AND password = ?
            LIMIT 1
            `,
      [username, password],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Username atau password salah",
      });
    }

    const user = rows[0];

    res.json({
      success: true,

      message: "Login berhasil",

      data: user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal melakukan login",
    });
  }
};

// =========================
// REGISTER CASHIER
// =========================

const registerCashier = async (req, res) => {
  try {
    const { store_id, name, username, password } = req.body;

    if (!store_id || !name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Semua data wajib diisi",
      });
    }

    const [existing] = await pool.query(
      `
                SELECT id
                FROM users
                WHERE username = ?
                LIMIT 1
                `,
      [username],
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Username sudah digunakan",
      });
    }

    const [result] = await pool.query(
      `
                INSERT INTO users (
                    store_id,
                    name,
                    username,
                    password,
                    role
                )
                VALUES (?, ?, ?, ?, 'cashier')
                `,
      [store_id, name, username, password],
    );

    res.status(201).json({
      success: true,

      message: "Cashier berhasil dibuat",

      data: {
        id: result.insertId,
        store_id,
        name,
        username,
        role: "cashier",
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal membuat cashier",
    });
  }
};

// =========================
// REGISTER OWNER
// =========================

const registerOwner = async (req, res) => {
  try {
    const { store_name, name, username, password } = req.body;

    if (!store_name || !name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Semua data wajib diisi",
      });
    }

    const [existing] = await pool.query(
      `
            SELECT id
            FROM users
            WHERE username = ?
            LIMIT 1
            `,
      [username],
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Username sudah digunakan",
      });
    }

    const [storeResult] = await pool.query(
      `
            INSERT INTO stores (name)
            VALUES (?)
            `,
      [store_name],
    );

    const storeId = storeResult.insertId;

    const [userResult] = await pool.query(
      `
            INSERT INTO users (
                store_id,
                name,
                username,
                password,
                role
            )
            VALUES (?, ?, ?, ?, 'owner')
            `,
      [storeId, name, username, password],
    );

    res.status(201).json({
      success: true,
      message: "Akun berhasil dibuat",
      data: {
        id: userResult.insertId,
        store_id: storeId,
        name,
        username,
        role: "owner",
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal membuat akun",
    });
  }
};

module.exports = {
  login,
  registerCashier,
  registerOwner,
};
