"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessTokenCode = exports.generateAccessTokenApp = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("config"));
const generateAccessTokenApp = (userEmail) => {
    return jsonwebtoken_1.default.sign({
        isUser: true,
        userEmail: userEmail,
    }, process.env.JWT_SECRET_KEY || config_1.default.get("jwt-secret-key"), { expiresIn: "1d" });
};
exports.generateAccessTokenApp = generateAccessTokenApp;
const generateAccessTokenCode = (payload) => {
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET_KEY || config_1.default.get("jwt-secret-key"), { expiresIn: "30m" });
};
exports.generateAccessTokenCode = generateAccessTokenCode;
