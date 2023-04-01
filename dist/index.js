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
const auth_1 = __importDefault(require("./routes/auth"));
const verification_1 = __importDefault(require("./routes/verification"));
const config_1 = __importDefault(require("config"));
const app = (0, express_1.default)();
// config vars
const port = config_1.default.get("port");
const db = config_1.default.get("db");
// connect to db
const connectDb = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(db);
        yield mongoose_1.default.connect(db);
    }
    catch (e) {
        console.log(e);
    }
    console.log(`[db]: db is running at ${db}`);
});
connectDb();
// middleware
app.use(express_1.default.json());
app.use("/api/auth", auth_1.default);
app.use("/api/verification", verification_1.default);
// test only
app.get("/", (req, res) => {
    res.status(200).send("Server works");
});
// listen
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
