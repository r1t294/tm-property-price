const express = require('express');
const router = express.Router();

const {
    mainView,
    propertyView,
    mainSearchFunction,
    loadingView,
} = require("../controllers/mainController");

router.get("/", mainView);
router.get("/property", propertyView);
router.get("/loading_page", loadingView)
router.post("/search", mainSearchFunction);

module.exports = router;