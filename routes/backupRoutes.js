const express = require("express");

const router = express.Router();

const {
    getBackup,
    restoreBackup
} = require("../controllers/backupController");

router.get("/backup", getBackup);
router.post("/backup/restore", restoreBackup);

module.exports = router;
