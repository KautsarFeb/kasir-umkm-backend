const pool = require("../config/database");

// =========================
// GET SEMUA PENGELUARAN
// =========================

const getExpenses = async (req, res) => {
  try {
    const { store_id, category, type } = req.query;
    const startDate = req.query.startDate || req.query.start_date;
    const endDate = req.query.endDate || req.query.end_date;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: "Store ID wajib diisi",
      });
    }

    let query = `
      SELECT
        id,
        store_id,
        type,
        category,
        description,
        amount,
        expense_date,
        created_at
      FROM expenses
      WHERE store_id = ?
    `;

    const params = [store_id];

    if (startDate) {
      query += `
        AND expense_date >= ?
      `;

      params.push(startDate);
    }

    if (endDate) {
      query += `
        AND expense_date <= ?
      `;

      params.push(endDate);
    }

    if (category) {
      query += `
        AND category = ?
      `;

      params.push(category);
    }

    if (type === "income" || type === "expense") {
      query += `
        AND type = ?
      `;

      params.push(type);
    }

    query += `
      ORDER BY
        expense_date DESC,
        id DESC
    `;

    const [expenses] = await pool.query(query, params);

    res.json({
      success: true,
      data: expenses,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil pengeluaran",
    });
  }
};

// =========================
// GET DETAIL PENGELUARAN
// =========================

const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: "Store ID wajib diisi",
      });
    }

    const [expenses] = await pool.query(
      `
        SELECT
          id,
          store_id,
          type,
          category,
          description,
          amount,
          expense_date,
          created_at
        FROM expenses
        WHERE id = ?
          AND store_id = ?
      `,
      [id, store_id],
    );

    if (expenses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pengeluaran tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: expenses[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail pengeluaran",
    });
  }
};

// =========================
// POST TAMBAH PENGELUARAN
// =========================

const createExpense = async (req, res) => {
  try {
    const {
      store_id,
      type = "expense",
      category,
      description,
      amount,
    } = req.body;
    const expenseDate = req.body.date || req.body.expense_date;

    if (!store_id || !category || amount === undefined || !expenseDate) {
      return res.status(400).json({
        success: false,
        message: "Data catatan keuangan belum lengkap",
      });
    }

    if (type !== "income" && type !== "expense") {
      return res.status(400).json({
        success: false,
        message: "Jenis catatan keuangan tidak valid",
      });
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Jumlah harus lebih dari 0",
      });
    }

    const [result] = await pool.query(
      `
        INSERT INTO expenses
        (
          store_id,
          type,
          category,
          description,
          amount,
          expense_date
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [store_id, type, category, description || null, amount, expenseDate],
    );

    res.status(201).json({
      success: true,
      message: "Catatan keuangan berhasil ditambahkan",
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal menambahkan pengeluaran",
    });
  }
};

// =========================
// PUT EDIT PENGELUARAN
// =========================

const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const { store_id, type, category, description, amount } = req.body;
    const expenseDate = req.body.date || req.body.expense_date;

    if (!store_id || !category || amount === undefined || !expenseDate) {
      return res.status(400).json({
        success: false,
        message: "Data catatan keuangan belum lengkap",
      });
    }

    if (type !== undefined && type !== "income" && type !== "expense") {
      return res.status(400).json({
        success: false,
        message: "Jenis catatan keuangan tidak valid",
      });
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Jumlah harus lebih dari 0",
      });
    }

    const [result] = await pool.query(
      `
        UPDATE expenses
        SET
          type = COALESCE(?, type),
          category = ?,
          description = ?,
          amount = ?,
          expense_date = ?
        WHERE id = ?
          AND store_id = ?
      `,
      [
        type || null,
        category,
        description || null,
        amount,
        expenseDate,
        id,
        store_id,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Catatan keuangan tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Catatan keuangan berhasil diperbarui",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal memperbarui pengeluaran",
    });
  }
};

// =========================
// DELETE PENGELUARAN
// =========================

const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: "Store ID wajib diisi",
      });
    }

    const [result] = await pool.query(
      `
        DELETE FROM expenses
        WHERE id = ?
          AND store_id = ?
      `,
      [id, store_id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Catatan keuangan tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Catatan keuangan berhasil dihapus",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal menghapus pengeluaran",
    });
  }
};

module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
};
