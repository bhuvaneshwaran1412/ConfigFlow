const express = require("express");
const multer = require("multer");

const router = express.Router();

const {
    getChangeRequests,
    addChangeRequest,
    deleteChangeRequest
} = require("../controllers/changeRequestController");

const {
    approveRequest
} = require("../controllers/approvalController");


// =====================================
// FILE UPLOAD CONFIGURATION
// =====================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },

    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() + "-" + file.originalname;

        cb(null, uniqueName);
    }

});

const upload = multer({
    storage: storage
});


// =====================================
// APPROVAL
// =====================================

router.put(
    "/change-requests/:id/approve",
    approveRequest
);


// =====================================
// GET CHANGE REQUESTS
// =====================================

router.get(
    "/change-requests",
    getChangeRequests
);


// =====================================
// ADD CHANGE REQUEST
// =====================================

router.post(
    "/change-requests",
    upload.single("attachment"),
    addChangeRequest
);


// =====================================
// DELETE CHANGE REQUEST
// =====================================

router.delete(
    "/change-requests/:id",
    deleteChangeRequest
);


module.exports = router;