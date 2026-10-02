const pool = require("../config/database");

const createTransaction = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { store_id, payment_method, items } = req.body;
    const description = req.body.description?.trim() || null;

    if (!store_id || !payment_method || !items) {
      return res.status(400).json({
        success: false,
        message: "Data transaksi belum lengkap",
      });
    }

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Keranjang masih kosong",
      });
    }

    await connection.beginTransaction();

    let totalAmount = 0;

    const transactionItems = [];

    for (const item of items) {
      const [products] = await connection.query(
        `
  SELECT
      id,
      name,
      purchase_price,
      selling_price,
      stock
  FROM products
  WHERE id = ?
    AND store_id = ?
  FOR UPDATE
  `,
        [item.product_id, store_id],
      );

      if (products.length === 0) {
        throw new Error(`Produk dengan ID ${item.product_id} tidak ditemukan`);
      }

      const product = products[0];

      if (product.stock < item.quantity) {
        throw new Error(`Stok ${product.name} tidak mencukupi`);
      }

      const subtotal = Number(product.selling_price) * Number(item.quantity);

      totalAmount += subtotal;

      transactionItems.push({
        productId: product.id,
        quantity: item.quantity,
        sellingPrice: product.selling_price,
        purchasePrice: product.purchase_price,
        subtotal: subtotal,
      });
    }

    const invoiceNumber = `TRX-${Date.now()}`;

    const [transactionResult] = await connection.query(
      `
                INSERT INTO transactions
                (
                    store_id,
                    invoice_number,
                    total_amount,
                    payment_method,
                    description
                )
                  VALUES (?, ?, ?, ?, ?)
                `,
      [store_id, invoiceNumber, totalAmount, payment_method, description],
    );

    const transactionId = transactionResult.insertId;

    for (const item of transactionItems) {
      await connection.query(
        `
                INSERT INTO transaction_details
                (
                    transaction_id,
                    product_id,
                    quantity,
                    selling_price,
                    purchase_price,
                    subtotal
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
        [
          transactionId,
          item.productId,
          item.quantity,
          item.sellingPrice,
          item.purchasePrice,
          item.subtotal,
        ],
      );

      await connection.query(
        `
  UPDATE products
  SET stock = stock - ?
  WHERE id = ?
    AND store_id = ?
  `,
        [item.quantity, item.productId, store_id],
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Transaksi berhasil",
      data: {
        transaction_id: transactionId,
        invoice_number: invoiceNumber,
        total_amount: totalAmount,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message || "Gagal membuat transaksi",
    });
  } finally {
    connection.release();
  }
};

const getTransactions = async (req, res) => {
  try {
    const { store_id, date, start_date, end_date, payment_method, product_id } =
      req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: "Store ID wajib diisi",
      });
    }

    let query = `
      SELECT DISTINCT
        t.id,
        t.invoice_number,
        t.total_amount,
        t.payment_method,
        t.created_at
      FROM transactions t
    `;

    const params = [];

    if (product_id) {
      query += `
        INNER JOIN transaction_details td
          ON t.id = td.transaction_id
      `;
    }

    query += `
      WHERE t.store_id = ?
    `;

    params.push(store_id);

    if (date) {
      query += `
        AND DATE(t.created_at) = ?
      `;

      params.push(date);
    }

    if (start_date) {
      query += `
        AND DATE(t.created_at) >= ?
      `;

      params.push(start_date);
    }

    if (end_date) {
      query += `
        AND DATE(t.created_at) <= ?
      `;

      params.push(end_date);
    }

    if (payment_method) {
      query += `
        AND t.payment_method = ?
      `;

      params.push(payment_method);
    }

    if (product_id) {
      query += `
        AND td.product_id = ?
      `;

      params.push(product_id);
    }

    query += `
      ORDER BY t.created_at DESC
    `;

    const [transactions] = await pool.query(query, params);

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil riwayat transaksi",
    });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: "Store ID wajib diisi",
      });
    }

    const [transactions] = await pool.query(
      `
        SELECT
          t.id,
          t.invoice_number,
          t.total_amount,
          t.payment_method,
          t.description,
          t.created_at
        FROM transactions t
        WHERE t.id = ?
          AND t.store_id = ?
      `,
      [id, store_id],
    );

    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Transaksi tidak ditemukan",
      });
    }

    const [details] = await pool.query(
      `
        SELECT
          td.id,
          td.product_id,
          p.name AS product_name,
          td.quantity,
          td.selling_price,
          td.purchase_price,
          td.subtotal
        FROM transaction_details td
        JOIN products p
          ON td.product_id = p.id
        WHERE td.transaction_id = ?
        ORDER BY td.id ASC
      `,
      [id],
    );

    res.json({
      success: true,
      data: {
        transaction: transactions[0],
        details: details,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail transaksi",
    });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
};
