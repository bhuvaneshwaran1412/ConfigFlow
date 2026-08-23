const express = require("express");

const router = express.Router();

const {
    getAuditLogs
} = require("../controllers/auditLogController");


router.get(
    "/audit-logs",
    getAuditLogs
);


module.exports = router;