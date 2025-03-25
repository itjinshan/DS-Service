import express from "express";
const bodyParser = require('body-parser');
require('dotenv').config();
const app = express();
const port = 8888;

// routes
//
const rootRouter = require('./APIs');
const deepseekRouter = require('./APIs/deepseek');

// middleware
//
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use('/', rootRouter);
app.use('/deepseek', deepseekRouter);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});