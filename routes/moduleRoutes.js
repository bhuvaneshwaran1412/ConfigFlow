const express = require("express");
const router = express.Router();

const {
    getModules,
    addModule,
    updateModule,
    deleteModule
} = require("../controllers/moduleController");
const { authorizeRoles } = require("../middleware/authorization");

router.get("/modules", getModules);
router.post("/modules", authorizeRoles("Admin", "Manager", "Developer"), addModule);
router.put("/modules/:id", authorizeRoles("Admin", "Manager", "Developer"), updateModule);
router.delete("/modules/:id", authorizeRoles("Admin", "Manager", "Developer"), deleteModule);

module.exports = router;