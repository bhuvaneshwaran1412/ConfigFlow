const express = require("express");

const router = express.Router();
const { authorizeRoles } = require("../middleware/authorization");

const {
    getBackup,
    restoreBackup
} = require("../controllers/backupController");

router.get("/backup", authorizeRoles("Admin"), getBackup);
router.post("/backup/restore", authorizeRoles("Admin"), restoreBackup);

module.exports = router;
