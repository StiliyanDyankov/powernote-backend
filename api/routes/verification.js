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
const lodash_1 = require("lodash");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("config"));
const portalDB_1 = require("../db/portalDB");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jwt_1 = require("../utils/jwt");
const verificationCode_1 = require("../utils/verificationCode");
const router = express_1.default.Router();
// request contains verification code in body
// request contains already validated user credentials in jwt, either:
// - password and email in case of register;
// - email in case of forgot;
// in any case contains generated from server verification code in jwt
// ---------------------------------
// validates verification code
// in case of success, appends stored in jwt credentials in req body and passes on
const validateReq = (req, res, next) => {
    var _a;
    // get header containing the token
    const authHeader = (0, lodash_1.pick)(req.headers, ["authorization"]);
    const providedCode = (0, lodash_1.pick)(req.body, ["verificationCode"]);
    // handle case when there is no such header
    if ((0, lodash_1.isEmpty)(authHeader)) {
        return res.status(401).json({
            message: "Unauthorized.",
        });
    }
    // handle case when there is no verification code
    if ((0, lodash_1.isEmpty)(providedCode)) {
        return res.status(409).json({
            message: "No verification code provided",
        });
    }
    // get only the contents of the header and clean it to get token
    const token = (_a = authHeader.authorization) === null || _a === void 0 ? void 0 : _a.substring(7);
    // handle case when the actual token doesn't exist in the string
    if (token === undefined || token === "") {
        return res.status(401).json({
            message: "Unauthorized.",
        });
    }
    // handle case when verification code is empty
    if (typeof providedCode.verificationCode !== "string" &&
        providedCode.verificationCode.length !== 5) {
        return res.status(409).json({
            message: "Invalid verification code",
        });
    }
    // decrypt jwt to get payload
    let payload = {};
    try {
        payload = jsonwebtoken_1.default.verify(token, config_1.default.get("jwt-secret-key"));
    }
    catch (error) {
        return res.status(401).json({
            message: "Session expired. Please retry again.",
        });
    }
    // return res.status(200).send(payload);
    // compare code in jwt payload to the one provided by user
    if (payload.verificationCode !==
        providedCode.verificationCode) {
        return res.status(409).json({
            message: "Invalid verification code",
            errors: {
                error: true,
            },
        });
    }
    else {
        req.body = payload;
        next();
        return;
    }
};
// request contains already validated user credentials in jwt, either:
// - password and email in case of register;
// - email in case of forgot;
// --------------------------------
// validates jwt
// gets credentials from prev jwt
// creates new jwt with new code and credentials from prev token
router.post("/resendCode", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // get header containing the token
    const authHeader = (0, lodash_1.pick)(req.headers, ["authorization"]);
    // handle case when there is no such header
    if ((0, lodash_1.isEmpty)(authHeader)) {
        return res.status(401).json({
            message: "Unauthorized.",
        });
    }
    // get only the contents of the header and clean it to get token
    const token = (_a = authHeader.authorization) === null || _a === void 0 ? void 0 : _a.substring(7);
    // handle case when the actual token doesn't exist in the string
    if (token === undefined || token === "") {
        return res.status(401).json({
            message: "Unauthorized.",
        });
    }
    // decrypt jwt to get payload
    let payload = {};
    try {
        payload = jsonwebtoken_1.default.verify(token, config_1.default.get("jwt-secret-key"));
    }
    catch (error) {
        return res.status(401).json({
            message: "Session expired. Please retry again.",
        });
    }
    // get user credentials from jwt
    const userCredentials = (0, lodash_1.pick)(payload, ["email", "password"]);
    // return new token
    const newToken = (0, verificationCode_1.handleVerificationCode)(userCredentials);
    return res.status(200).json({
        message: "Authentication successful!",
        token: "Bearer " + newToken,
    });
}));
// contains validated by middleware credentials in body
// creates user
router.post("/register", validateReq, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let userCredentials = (0, lodash_1.pick)(req.body, ["email", "password"]);
    let hashedUserCredentials = Object.assign({}, userCredentials);
    const salt = yield bcrypt_1.default.genSalt();
    hashedUserCredentials.password = yield bcrypt_1.default.hash(userCredentials.password, salt);
    // create user
    const result = yield (0, portalDB_1.createUser)(hashedUserCredentials);
    // handle error case from createUser()
    if (result.message) {
        return res.status(500).json({
            message: "User already registered.",
        });
    }
    else {
        // handle success case from createUser()
        const token = (0, jwt_1.generateAccessTokenApp)(userCredentials.email);
        return res.status(200).json({
            message: "Authentication successful!",
            token: "Bearer " + token,
        });
    }
}));
// get valid email from decrypted jwt
// return authorized user token, to be used in submitting new pass
router.post("/forgot", validateReq, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let userCredentials = (0, lodash_1.pick)(req.body, ["email"]);
    const token = (0, jwt_1.generateAccessTokenApp)(userCredentials.email);
    return res.status(200).json({
        message: "Authentication successful!",
        token: "Bearer " + token,
    });
}));
exports.default = router;
