var express = require('express');
var router = express.Router();
var deepseek = require('../Deepseek/deepseek');

router.get("/", (req: any, res: any) => {
    res.send("Welcome to DS-Service deepseek API");
});

router.get("/plantrip", (req: any, res: any) => {
    deepseek(req.body.query).then((response: any) => {
        res.send(response);
    });
});

module.exports = router;