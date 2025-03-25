"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bodyParser = require('body-parser');
require('dotenv').config();
const app = (0, express_1.default)();
const port = 8888;
// routes
//
const rootRouter = require('./APIs');
const deepseekRouter = require('./APIs/deepseek');
// middleware
//
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', rootRouter);
app.use('/deepseek', deepseekRouter);
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
