if (process.env.USE_MOCK_DB === "true" || process.env.DB_HOST === "mock") {
    const MockDatabase = require("../tests/e2e/mock_db");
    const mockDb = new MockDatabase();
    console.log("⚡ [Demo Mode] Using In-Memory Database with sample data");
    module.exports = mockDb;
    return;
}

const mysql = require("mysql2");
const isLocalDatabase = ["localhost", "127.0.0.1", "::1"].includes(process.env.DB_HOST);
const useSsl = process.env.DB_SSL
    ? process.env.DB_SSL.toLowerCase() !== "false"
    : !isLocalDatabase;

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || (isLocalDatabase ? 3306 : 4000)),
    ssl: useSsl ? { rejectUnauthorized: true } : undefined
});
db.connect((err) => {
    if (err) {
        console.log("Database Connection Failed");
        console.log(err);
        return;
    }
    console.log("✅ MySQL Connected");
});
module.exports = db;