
const express = require("express");
const router = express.Router();
const { authorizeRoles } = require("../middleware/authorization");

const { approveRequest } = require("../controllers/approvalController");

router.put("/approve-request/:id", authorizeRoles("Admin", "Manager"), approveRequest);

module.exports = router;