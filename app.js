require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const moduleRoutes = require("./routes/moduleRoutes");
const changeRequestRoutes=require("./routes/changeRequestRoutes");
const approvalRoutes = require("./routes/approvalRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");
console.log("REPORT ROUTES FILE PATH:", require.resolve("./routes/reportRoutes"));
const searchRoutes = require("./routes/searchRoutes");
const versionRoutes = require("./routes/versionRoutes");
const releaseNoteRoutes = require("./routes/releaseNoteRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");
const backupRoutes = require("./routes/backupRoutes");
const { requireAuth } = require("./middleware/authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static("public", { extensions: ["html"] }));
app.use("/uploads",express.static("uploads"));
app.use("/api", authRoutes);
app.use("/api", requireAuth);
app.use("/api", projectRoutes);
app.use("/api", moduleRoutes);
app.use("/api", changeRequestRoutes);
app.use("/api", approvalRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", reportRoutes);
app.use("/api", searchRoutes);
app.use("/api", versionRoutes);
app.use("/api", releaseNoteRoutes);
app.use("/api", auditLogRoutes);
app.use("/api", backupRoutes);

app.get("/", (req, res) => {
    res.send("Welcome to ConfigFlow API");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});