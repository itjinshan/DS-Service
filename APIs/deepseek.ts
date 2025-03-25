var express = require('express');
var router = express.Router();

router.get("/", (req: any, res: any) => {
    res.send("Welcome to DS-Service deepseek API");
});

module.exports = router;