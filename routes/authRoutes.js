const express = require("express");
const router = express.Router();

const {
	login,
	register,
	logout,
	getEmployeeIdPreview
} = require("../controllers/authController");

router.post("/login", login);
router.post("/register", register);
router.post("/logout", logout);
router.get("/employee-id-preview", getEmployeeIdPreview);

module.exports = router;