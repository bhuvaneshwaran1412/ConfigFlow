const express = require("express");

const router = express.Router();
const { authorizeRoles } = require("../middleware/authorization");

const {
    getReleaseNotes,
    addReleaseNote
} = require("../controllers/releaseNoteController");


router.get(
    "/release-notes",
    getReleaseNotes
);

router.post("/release-notes", authorizeRoles("Admin"), addReleaseNote);


module.exports = router;