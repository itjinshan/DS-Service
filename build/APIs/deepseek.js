"use strict";
var express = require('express');
var router = express.Router();
router.get("/", (req, res) => {
    res.send("Welcome to DS-Service deepseek API");
});
module.exports = router;
