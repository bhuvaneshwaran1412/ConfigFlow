const express = require("express");

const router = express.Router();

const {
    getReports,
    getReportStats,
    getProjectReport,
    getVersionReport
} = require("../controllers/reportController");

router.get("/reports", getReports);

router.get("/reports/stats", getReportStats);

router.get("/reports/projects", getProjectReport);

router.get("/reports/versions", getVersionReport);

module.exports = router;