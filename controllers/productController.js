const pool = require("../config/database");

// GET semua produk berdasarkan toko
const getProducts = async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: "Store ID wajib diisi",
      });
    }

    const [products] = await pool.query(
      `
            SELECT
                p.id,
                p.name,
                p.purchase_price,
                p.selling_price,
                p.stock,
                c.id AS category_id,
                c.name AS category
            FROM products p
            LEFT JOIN categories c
                ON p.category_id = c.id
            WHERE p.store_id = ?
            ORDER BY p.id DESC
        `,
      [store_id],
    );

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil data produk",
    });
  }
};

// GET produk berdasarkan ID dan toko
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: "Store ID wajib diisi",
      });
    }

    const [products] = await pool.query(
      `
            SELECT
                p.id,
                p.name,
                p.purchase_price,
                p.selling_price,
                p.stock,
                c.id AS category_id,
                c.name AS category
            FROM products p
            LEFT JOIN categories c
                ON p.category_id = c.id
            WHERE p.id = ?
              AND p.store_id = ?
        `,
      [id, store_id],
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: products[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil produk",
    });
  }
};

// POST tambah produk
const createProduct = async (req, res) => {
  try {
    const {
      store_id,
      category_id,
      name,
      purchase_price,
      selling_price,
      stock,
    } = req.body;

    if (!store_id || !name || selling_price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Data produk belum lengkap",
      });
    }

    const [result] = await pool.query(
      `
            INSERT INTO products
            (
                store_id,
                category_id,
                name,
                purchase_price,
                selling_price,
                stock
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `,
      [
        store_id,
        category_id || null,
        name,
        purchase_price || 0,
        selling_price,
        stock || 0,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Produk berhasil ditambahkan",
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal menambahkan produk",
    });
  }
};

// PUT edit produk
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      store_id,
      category_id,
      name,
      purchase_price,
      selling_price,
      stock,
    } = req.body;

    if (!store_id || !name || selling_price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Data produk belum lengkap",
      });
    }

    const [result] = await pool.query(
      `
            UPDATE products
            SET
                category_id = ?,
                name = ?,
                purchase_price = ?,
                selling_price = ?,
                stock = ?
            WHERE id = ?
              AND store_id = ?
        `,
      [
        category_id || null,
        name,
        purchase_price || 0,
        selling_price,
        stock || 0,
        id,
        store_id,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Produk berhasil diperbarui",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal memperbarui produk",
    });
  }
};

// DELETE produk
const deleteProduct = async (req, res) => {
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
      "DELETE FROM products WHERE id = ? AND store_id = ?",
      [id, store_id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Produk berhasil dihapus",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal menghapus produk",
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
