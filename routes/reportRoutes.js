const express = require("express");

const router = express.Router();

const {
    getReports,
    getReportStats,
    getProjectReport,
    getVersionReport,
    getAnalytics
} = require("../controllers/reportController");

router.get("/reports", getReports);

router.get("/reports/stats", getReportStats);

router.get("/reports/projects", getProjectReport);

router.get("/reports/versions", getVersionReport);

router.get("/reports/analytics", getAnalytics);

module.exports = router;