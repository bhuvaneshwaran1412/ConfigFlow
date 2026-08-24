
const express = require("express");
const router = express.Router();

const {
    getProjects,
    addProject,
    updateProject,
    deleteProject,
    getAssignableUsers,
    assignManager,
    assignDeveloper
} = require("../controllers/projectController");
const { authorizeRoles } = require("../middleware/authorization");

router.get("/projects", getProjects);
router.get("/users/assignable", authorizeRoles("Admin", "Manager"), getAssignableUsers);
router.post("/projects", authorizeRoles("Admin"), addProject);
router.post("/projects/:id/manager", authorizeRoles("Admin"), assignManager);
router.post("/projects/:id/developers", authorizeRoles("Admin", "Manager"), assignDeveloper);
router.put("/projects/:id", authorizeRoles("Admin", "Manager"), updateProject);
router.delete("/projects/:id", authorizeRoles("Admin"), deleteProject);

module.exports = router;