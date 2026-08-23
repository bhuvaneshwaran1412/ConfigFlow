
const express = require("express");
const router = express.Router();

const { approveRequest } = require("../controllers/approvalController");

router.put("/approve-request/:id", approveRequest);

module.exports = router;