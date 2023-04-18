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
exports.changePass = exports.findUser = exports.createUser = exports.Users = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// import config from "config";
mongoose_1.default.set("strictQuery", false);
const userSchema = new mongoose_1.default.Schema({
    email: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 255,
    },
});
exports.Users = mongoose_1.default.model("users", userSchema);
const createUser = (user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield exports.Users.create({
            email: user.email,
            password: user.password,
        });
        return result;
    }
    catch (err) {
        console.log("Could not create new doc", err.message);
        return err;
    }
});
exports.createUser = createUser;
const findUser = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield exports.Users.findOne({
            email: email,
        });
        return result;
    }
    catch (err) {
        console.log("could not find user with given email", err);
        return err;
    }
});
exports.findUser = findUser;
const changePass = (user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield exports.Users.updateOne({ email: user.email }, { password: user.password });
        return result.acknowledged;
    }
    catch (err) {
        console.log("could not update user with given email", err);
        return err;
    }
});
exports.changePass = changePass;
