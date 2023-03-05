import express, { Request, Response } from "express";
import mongoose from "mongoose";
const config = require('config');

const app = express();
const port = config.get("port");


const db: string = config.get("db");
const connectDb = async () => {
    try {
        console.log(db)
        await mongoose.connect(db);

    } catch(e: unknown) {
        console.log(e);
    }
    console.log("connected to db");
}

connectDb();

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 30,
    },
    email: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 30,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 255,
    },
    isAdmin: {
        type: Boolean,
    }
});

const getUsers = async () => {
    try {
        const result = await Users.find();
        console.log("result from fetch", result);
        return result;
    } catch (err) {
        console.log("Could not find Customer with the given id", err);
        return err;
    }
};



const Users = mongoose.model("users", userSchema);

app.get("/", (req: Request, res: Response) => {
    res.status(200).send("Express + TypeScript Serve");
});

app.get("/users", async (req: Request, res: Response) => {
    const result = await getUsers();
    res.send(result);
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
