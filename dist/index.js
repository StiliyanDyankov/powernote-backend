"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const config = require('config');
const app = (0, express_1.default)();
const port = config.get("port");
const db = config.get("db");
const connectDb = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(db);
        yield mongoose_1.default.connect(db);
    }
    catch (e) {
        console.log(e);
    }
    console.log("connected to db");
});
connectDb();
const userSchema = new mongoose_1.default.Schema({
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
const getUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield Users.find();
        console.log("result from fetch", result);
        return result;
    }
    catch (err) {
        console.log("Could not find Customer with the given id", err);
        return err;
    }
});
const Users = mongoose_1.default.model("users", userSchema);
app.get("/", (req, res) => {
    res.status(200).send("Express + TypeScript Serve");
});
app.get("/users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield getUsers();
    res.send(result);
}));
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
