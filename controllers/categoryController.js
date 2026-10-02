const pool = require("../config/database");

// GET semua kategori berdasarkan toko
const getCategories = async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: "Store ID wajib diisi",
      });
    }

    const [categories] = await pool.query(
      `
            SELECT
                id,
                name
            FROM categories
            WHERE store_id = ?
            ORDER BY name ASC
        `,
      [store_id],
    );

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil kategori",
    });
  }
};

// POST tambah kategori
const createCategory = async (req, res) => {
  try {
    const { store_id, name } = req.body;

    if (!store_id || !name) {
      return res.status(400).json({
        success: false,
        message: "Store ID dan nama kategori wajib diisi",
      });
    }

    const [result] = await pool.query(
      `
            INSERT INTO categories
            (store_id, name)
            VALUES (?, ?)
        `,
      [store_id, name],
    );

    res.status(201).json({
      success: true,
      message: "Kategori berhasil ditambahkan",
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal menambahkan kategori",
    });
  }
};

// DELETE kategori
const deleteCategory = async (req, res) => {
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
      "DELETE FROM categories WHERE id = ? AND store_id = ?",
      [id, store_id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Kategori berhasil dihapus",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal menghapus kategori",
    });
  }
};

module.exports = {
  getCategories,
  createCategory,
  deleteCategory,
};
