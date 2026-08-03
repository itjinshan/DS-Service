import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
require('dotenv').config();

import rootRouter from './APIs';
import deepseekRouter from './APIs/deepseek';
import dataSourcingRouter from './APIs/datasourcing';
import nluRouter from './APIs/nlu';

const app = express();
const port = process.env.PORT || 8888;

// middleware
//
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
//
app.use('/', rootRouter);
app.use('/deepseek', deepseekRouter);
app.use('/datasourcing', dataSourcingRouter);
app.use('/nlu', nluRouter);

// error handling
//
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).send("Internal server error");
});

async function start() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "");
        console.log("MongoDB connected");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }

    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}

start();
