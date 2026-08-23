const express = require("express");

const router = express.Router();

const {
    getReleaseNotes,
    addReleaseNote
} = require("../controllers/releaseNoteController");


router.get(
    "/release-notes",
    getReleaseNotes
);

router.post(
    "/release-notes",
    addReleaseNote
);


module.exports = router;