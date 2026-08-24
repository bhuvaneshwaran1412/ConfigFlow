const express = require("express");

const router = express.Router();
const { authorizeRoles } = require("../middleware/authorization");

const {
    getAuditLogs
} = require("../controllers/auditLogController");


router.get(
    "/audit-logs",
    authorizeRoles("Admin", "Manager", "Developer"),
    getAuditLogs
);


module.exports = router;