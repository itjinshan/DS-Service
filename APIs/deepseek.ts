var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var deepseek = require('../Deepseek/deepseek');

router.get("/", (req: any, res: any) => {
    const authToken = req.body.token;
    if(authToken) {
        jwt.verify(authToken, process.env.DEEPSEEK_JWT_SECRET, (err: any, decoded: any) => {
            if (err) {
                res.status(401).send("Unauthorized");
            } else {
                res.send("Welcome to DS-Service deepseek API");
            }
        });
    }
    else {
        res.status(401).send("Unauthorized");
    }
});

router.get("/plantrip", (req: any, res: any) => {
    const authToken = req.body.token;
    if(authToken) {
        jwt.verify(authToken, process.env.DEEPSEEK_JWT_SECRET, (err: any, decoded: any) => {
            if (err) {
                res.status(401).send("Unauthorized");
            } else {
                deepseek(req.body.query).then((response: any) => {
                    res.status(200).send(response);
                });
            }
        });
    }
    else {
        res.status(401).send("Unauthorized");
    }
});

module.exports = router;