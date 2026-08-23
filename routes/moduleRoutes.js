const express = require("express");
const router = express.Router();

const {
    getModules,
    addModule,
    updateModule,
    deleteModule
} = require("../controllers/moduleController");

router.get("/modules", getModules);
router.post("/modules", addModule);
router.put("/modules/:id", updateModule);
router.delete("/modules/:id", deleteModule);

module.exports = router;