import express from "express";
import mongoose from "mongoose";
const bodyParser = require('body-parser');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 8888;

// routes
//
const rootRouter = require('./APIs');
const deepseekRouter = require('./APIs/deepseek');

mongoose 
    .connect(process.env.MONGODB_URI || "")
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((err: any) => {
        console.error("MongoDB connection error:", err);
    });

// middleware
//
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use('/', rootRouter);
app.use('/deepseek', deepseekRouter);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});