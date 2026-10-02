const pool = require("../config/database");

// =========================
// GET LAPORAN PENJUALAN
// =========================

const getSalesReport = async (req, res) => {
  try {
    const { store_id, start_date, end_date, product_id, payment_method } =
      req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: "Store ID wajib diisi",
      });
    }

    let query = `
      SELECT
        COUNT(DISTINCT t.id) AS total_transactions,

        COALESCE(
          SUM(td.quantity),
          0
        ) AS total_items_sold,

        COALESCE(
          SUM(td.subtotal),
          0
        ) AS total_revenue,

        COALESCE(
          SUM(
            td.purchase_price * td.quantity
          ),
          0
        ) AS total_cost,

        COALESCE(
          SUM(td.subtotal) -
          SUM(
            td.purchase_price * td.quantity
          ),
          0
        ) AS gross_profit

      FROM transactions t

      JOIN transaction_details td
        ON t.id = td.transaction_id

      WHERE t.store_id = ?
    `;

    const params = [store_id];

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

    if (product_id) {
      query += `
        AND td.product_id = ?
      `;

      params.push(product_id);
    }

    if (payment_method) {
      query += `
        AND t.payment_method = ?
      `;

      params.push(payment_method);
    }

    const [rows] = await pool.query(query, params);

    const report = rows[0];

    res.json({
      success: true,
      data: {
        total_transactions: Number(report.total_transactions),

        total_items_sold: Number(report.total_items_sold),

        total_revenue: Number(report.total_revenue),

        total_cost: Number(report.total_cost),

        gross_profit: Number(report.gross_profit),
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil laporan penjualan",
    });
  }
};

// =========================
// GET PENJUALAN PER MENU
// =========================

const getSalesByProduct = async (req, res) => {
  try {
    const { store_id, start_date, end_date, payment_method } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: "Store ID wajib diisi",
      });
    }

    let query = `
      SELECT
        p.id AS product_id,
        p.name AS product_name,

        COALESCE(
          SUM(td.quantity),
          0
        ) AS total_quantity,

        COALESCE(
          SUM(td.subtotal),
          0
        ) AS total_revenue,

        COALESCE(
          SUM(
            td.purchase_price * td.quantity
          ),
          0
        ) AS total_cost,

        COALESCE(
          SUM(td.subtotal) -
          SUM(
            td.purchase_price * td.quantity
          ),
          0
        ) AS gross_profit

      FROM transaction_details td

      JOIN transactions t
        ON td.transaction_id = t.id

      JOIN products p
        ON td.product_id = p.id

      WHERE t.store_id = ?
    `;

    const params = [store_id];

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

    query += `
      GROUP BY
        p.id,
        p.name

      ORDER BY
        total_quantity DESC
    `;

    const [products] = await pool.query(query, params);

    const data = products.map((product) => ({
      product_id: Number(product.product_id),

      product_name: product.product_name,

      total_quantity: Number(product.total_quantity),

      total_revenue: Number(product.total_revenue),

      total_cost: Number(product.total_cost),

      gross_profit: Number(product.gross_profit),
    }));

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil penjualan per menu",
    });
  }
};

// =========================
// GET LAPORAN KEUANGAN
// =========================

const getFinancialReport = async (req, res) => {
  try {
    const { store_id, start_date, end_date } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: "Store ID wajib diisi",
      });
    }

    // =========================
    // PENJUALAN
    // =========================

    let salesQuery = `
      SELECT
        COUNT(DISTINCT t.id) AS total_transactions,

        COALESCE(
          SUM(td.quantity),
          0
        ) AS total_items_sold,

        COALESCE(
          SUM(td.subtotal),
          0
        ) AS total_revenue,

        COALESCE(
          SUM(
            td.purchase_price * td.quantity
          ),
          0
        ) AS total_cost

      FROM transactions t

      JOIN transaction_details td
        ON t.id = td.transaction_id

      WHERE t.store_id = ?
    `;

    const salesParams = [store_id];

    if (start_date) {
      salesQuery += `
        AND DATE(t.created_at) >= ?
      `;

      salesParams.push(start_date);
    }

    if (end_date) {
      salesQuery += `
        AND DATE(t.created_at) <= ?
      `;

      salesParams.push(end_date);
    }

    const [salesRows] = await pool.query(salesQuery, salesParams);

    const sales = salesRows[0];

    // =========================
    // PENGELUARAN
    // =========================

    let expenseQuery = `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)
          AS total_expenses,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)
          AS total_other_income

      FROM expenses

      WHERE store_id = ?
    `;

    const expenseParams = [store_id];

    if (start_date) {
      expenseQuery += `
        AND expense_date >= ?
      `;

      expenseParams.push(start_date);
    }

    if (end_date) {
      expenseQuery += `
        AND expense_date <= ?
      `;

      expenseParams.push(end_date);
    }

    const [expenseRows] = await pool.query(expenseQuery, expenseParams);

    const expenses = expenseRows[0];

    // =========================
    // PERHITUNGAN
    // =========================

    const totalRevenue = Number(sales.total_revenue);

    const totalCost = Number(sales.total_cost);

    const totalExpenses = Number(expenses.total_expenses);

    const totalOtherIncome = Number(expenses.total_other_income);

    const grossProfit = totalRevenue - totalCost;

    const netProfit = grossProfit - totalExpenses;

    // =========================
    // RESPONSE
    // =========================

    res.json({
      success: true,

      data: {
        total_transactions: Number(sales.total_transactions),

        total_items_sold: Number(sales.total_items_sold),

        total_revenue: totalRevenue,

        total_cost: totalCost,

        gross_profit: grossProfit,

        total_expenses: totalExpenses,

        total_other_income: totalOtherIncome,

        net_profit: netProfit,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil laporan keuangan",
    });
  }
};

module.exports = {
  getSalesReport,
  getSalesByProduct,
  getFinancialReport,
};
