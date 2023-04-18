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
const portal_1 = __importDefault(require("./routes/portal"));
const verification_1 = __importDefault(require("./routes/verification"));
const config_1 = __importDefault(require("config"));
const app = (0, express_1.default)();
// config vars
const port = parseInt(process.env.PORT || "3000") || config_1.default.get("port");
const db = process.env.DB;
if (!process.env.DB) {
    console.error("FATAL ERROR: DB is not defined.");
    process.exit(1);
}
if (!process.env.JWT_SECRET_KEY) {
    console.error("FATAL ERROR: JWT_SECRET_KEY is not defined.");
    process.exit(1);
}
if (!process.env.EMAIL_USERNAME) {
    console.error("FATAL ERROR: EMAIL_USERNAME is not defined.");
    process.exit(1);
}
if (!process.env.EMAIL_PASSWORD) {
    console.error("FATAL ERROR: EMAIL_PASSWORD is not defined.");
    process.exit(1);
}
// const db: string = config.get("db");
// connect to db
const connectDb = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(db);
        yield mongoose_1.default.connect(db, {});
        console.log(`[db]: db is running at ${db}`);
    }
    catch (e) {
        console.log(e);
    }
});
connectDb();
// middleware
app.use(express_1.default.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "*");
    next();
});
app.use("/api/auth", portal_1.default);
app.use("/api/verification", verification_1.default);
// test only
app.get("/", (req, res) => {
    res.status(200).send("Server works");
});
// listen
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
