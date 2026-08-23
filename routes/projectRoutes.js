
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

router.get("/projects", getProjects);
router.get("/users/assignable", getAssignableUsers);
router.post("/projects", addProject);
router.post("/projects/:id/manager", assignManager);
router.post("/projects/:id/developers", assignDeveloper);
router.put("/projects/:id", updateProject);
router.delete("/projects/:id", deleteProject);

module.exports = router;