const db = require("./db");

db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Gagal terhubung ke Aiven MySQL");
    console.error(err.message);
    process.exit(1);
  }

  console.log("✅ Berhasil terhubung ke Aiven MySQL!");

  connection.query("SELECT 1 AS test", (err, results) => {
    connection.release();

    if (err) {
      console.error("❌ Query gagal:", err.message);
      process.exit(1);
    }

    console.log("✅ Query MySQL berhasil:", results);
    process.exit(0);
  });
});
