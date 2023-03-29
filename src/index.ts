import express, { Request, Response } from "express";
import mongoose from "mongoose";
import routerAuth from "./routes/auth";
import config from "config";

const app = express();

// config vars
const port = config.get("port");
const db: string = config.get("db");

// connect to db
const connectDb = async () => {
    try {
        console.log(db);
        await mongoose.connect(db);
    } catch (e: unknown) {
        console.log(e);
    }
    console.log(`[db]: db is running at ${db}`);
};
connectDb();

// middleware
app.use(express.json());
app.use("/api/auth", routerAuth);


// test only
app.get("/", (req: Request, res: Response) => {
    res.status(200).send("Server works");
});

// listen
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
