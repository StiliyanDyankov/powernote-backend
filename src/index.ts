import express, { Request, Response } from "express";
import mongoose from "mongoose";
import routerAuth from "./routes/portal";
import routerVerification from "./routes/verification";
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
app.use((req: Request, res: Response, next: any) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "*");
    next();
});
app.use("/api/auth", routerAuth);
app.use("/api/verification", routerVerification);


// test only
app.get("/", (req: Request, res: Response) => {
    res.status(200).send("Server works");
});

// listen
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
