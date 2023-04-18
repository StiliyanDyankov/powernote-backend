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
const portalDB_1 = require("../db/portalDB");
const bcrypt_1 = __importDefault(require("bcrypt"));
const credentialValidation_1 = require("../utils/credentialValidation");
const lodash_1 = require("lodash");
const verificationCode_1 = require("../utils/verificationCode");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("config"));
const jwt_1 = require("../utils/jwt");
const router = express_1.default.Router();
const noEmailServerError = {
    noEmailServer: true,
    invalidEmailForm: false,
    alreadyExists: false,
};
router.get("/", (req, res) => {
    res.status(200).send("Auth router works");
});
router.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let userCredentials = (0, lodash_1.pick)(req.body, ["email", "password"]);
    // check if email exists in credentials
    if (!userCredentials.email) {
        const unprovidedEmailError = (0, credentialValidation_1.checkEmailErrors)("");
        const resEmailErrors = {
            message: "No email provided.",
            errors: unprovidedEmailError,
        };
        return res.status(401).json(resEmailErrors);
        // error is to be passed to the field
    }
    // check for email errors
    const emailErrors = (0, credentialValidation_1.checkEmailErrors)(userCredentials.email);
    if (!(0, credentialValidation_1.validateEmail)(emailErrors)) {
        const resEmailErrors = {
            message: "Invalid email.",
            errors: emailErrors,
        };
        return res.status(401).json(resEmailErrors);
        // error is to be passed to the field
    }
    // check if such user exists
    const isRegistered = yield (0, portalDB_1.findUser)(userCredentials.email);
    // handle case when such user doesn't exist
    if (isRegistered === null) {
        // don't do anything; pass on to the next steps
    }
    // handle case when such user exists
    else if ("_id" in
        isRegistered) {
        const resEmailErrors = {
            message: "Account with such email already exists.",
            errors: {
                noEmailServer: false,
                invalidEmailForm: false,
                alreadyExists: true,
            },
        };
        return res.status(409).json(resEmailErrors);
        // error is to be passed to the field
    }
    // handle error case from findUser()
    else if ("message" in isRegistered) {
        return res.status(500).json({
            message: "INTERNAL ERROR!!! Couldn't create new user. Please try again later.",
        });
        // error is to be passed to snackbar
    }
    // check if password exists in credentials
    if (!userCredentials.password) {
        const noPasswordError = (0, credentialValidation_1.checkPasswordErrors)("");
        const resPasswordErrors = {
            message: "No password provided.",
            errors: noPasswordError,
        };
        return res.status(401).json(resPasswordErrors);
        // error is to be passed to the field
    }
    // check for password errors
    const passwordErrors = (0, credentialValidation_1.checkPasswordErrors)(userCredentials.password);
    if (!(0, credentialValidation_1.validatePassword)(passwordErrors)) {
        const resPasswordErrors = {
            message: "Invalid password.",
            errors: passwordErrors,
        };
        return res.status(401).json(resPasswordErrors);
        // error is to be passed to the field
    }
    // Here should be validation code handling
    // Here should be jwt issuing
    const token = (0, verificationCode_1.handleVerificationCode)({
        email: userCredentials.email,
        password: userCredentials.password,
    });
    return res.status(200).json({
        message: "Authentication successful!",
        token: "Bearer " + token,
    });
}));
router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let userCredentials = (0, lodash_1.pick)(req.body, ["email", "password"]);
    // check if email exists in credentials
    if (!userCredentials.email) {
        const resEmailErrors = {
            message: "No email provided.",
            errors: noEmailServerError,
        };
        return res.status(401).json(resEmailErrors);
        // error is to be passed to the field
    }
    // check for email errors
    // no validation needed for login UX
    // kept to protect against malicious attacks
    const emailErrors = (0, credentialValidation_1.checkEmailErrors)(userCredentials.email);
    if (!(0, credentialValidation_1.validateEmail)(emailErrors)) {
        const resEmailErrors = {
            message: "Account with such email doesn't exist.",
            errors: noEmailServerError,
        };
        return res.status(401).json(resEmailErrors);
        // error is to be passed to the field
    }
    // check if such user exists
    const isRegistered = yield (0, portalDB_1.findUser)(userCredentials.email);
    // handle case when such user doesn't exist
    let hashedPass = "";
    if (isRegistered === null) {
        const resEmailErrors = {
            message: "Account with such email doesn't exist.",
            errors: noEmailServerError,
        };
        return res.status(401).json(resEmailErrors);
        // error is to be passed to the field
    }
    else if ("_id" in
        isRegistered) {
        hashedPass = isRegistered.password;
    }
    // handle error case from findUser()
    else if ("message" in isRegistered) {
        return res.status(500).json({
            message: "INTERNAL ERROR!!! Couldn't find user. Please try again later.",
        });
        // error is to be passed to snackbar;
    }
    // check if password exists
    if (!userCredentials.password) {
        const resPasswordErrors = {
            message: "Invalid password.",
            errors: {
                noPasswordServer: true,
                noLength: false,
                noUppercase: false,
                noLowercase: false,
                noNumber: false,
                noSymbol: false,
            },
        };
        return res.status(401).json(resPasswordErrors);
        // error is to be passed to the field
    }
    // check for password errors
    // no validation needed for login UX
    // kept to protect against malicious attacks
    const passwordErrors = (0, credentialValidation_1.checkPasswordErrors)(userCredentials.password);
    if (!(0, credentialValidation_1.validatePassword)(passwordErrors)) {
        const resPasswordErrors = {
            message: "Invalid password.",
            errors: {
                noPasswordServer: true,
                noLength: false,
                noUppercase: false,
                noLowercase: false,
                noNumber: false,
                noSymbol: false,
            },
        };
        return res.status(401).json(resPasswordErrors);
        // error is to be passed to the field
    }
    // validate password
    let passIsValid = false;
    if (hashedPass !== "") {
        passIsValid = yield bcrypt_1.default.compare(userCredentials.password, hashedPass);
    }
    // handle password validation paths
    if (!passIsValid) {
        const resPasswordErrors = {
            message: "Invalid password.",
            errors: {
                noPasswordServer: true,
                noLength: false,
                noUppercase: false,
                noLowercase: false,
                noNumber: false,
                noSymbol: false,
            },
        };
        return res.status(401).json(resPasswordErrors);
        // error is to be passed to the field
    }
    // handle success case
    else {
        const token = (0, jwt_1.generateAccessTokenApp)(userCredentials.email);
        return res.status(200).json({
            message: "Authentication successful!",
            token: "Bearer " + token,
        });
    }
}));
router.post("/forgot/emailAuth", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let userCredentials = (0, lodash_1.pick)(req.body, ["email"]);
    // check if email exists in credentials
    if (!userCredentials.email) {
        const resEmailErrors = {
            message: "No email provided.",
            errors: noEmailServerError,
        };
        return res.status(401).json(resEmailErrors);
        // error is to be passed to the field
    }
    // check for email errors
    // no validation needed for auth UX
    // kept to protect against malicious attacks
    const emailErrors = (0, credentialValidation_1.checkEmailErrors)(userCredentials.email);
    if (!(0, credentialValidation_1.validateEmail)(emailErrors)) {
        const resEmailErrors = {
            message: "Account with such email doesn't exist.",
            errors: noEmailServerError,
        };
        return res.status(401).json(resEmailErrors);
        // error is to be passed to the field
    }
    // check if such user exists
    const isRegistered = yield (0, portalDB_1.findUser)(userCredentials.email);
    // handle case when such user doesn't exist
    if (isRegistered === null) {
        const resEmailErrors = {
            message: "Account with such email doesn't exist.",
            errors: noEmailServerError,
        };
        return res.status(401).json(resEmailErrors);
        // error is to be passed to the field
    }
    // handle success case
    else if ("_id" in
        isRegistered) {
        // Here should be validation code handling
        // Here should be jwt issuing
        const token = (0, verificationCode_1.handleVerificationCode)({ email: userCredentials.email });
        return res.status(200).json({
            message: "Authentication successful!",
            token: "Bearer " + token,
        });
    }
    // handle error case from findUser()
    else if ("message" in isRegistered) {
        return res.status(500).json({
            message: "INTERNAL ERROR!!! Couldn't find user. Please try again later.",
        });
        // error is to be passed to snackbar;
    }
    return res.status(500).json({
        message: "INTERNAL ERROR!!! Couldn't find user. Please try again later.",
    });
    // error is to be passed to snackbar;
}));
// req contains jwt in header - authorized as valid user
router.post("/forgot/changePassword", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const authHeader = (0, lodash_1.pick)(req.headers, ["authorization"]);
    // handle case when there is no such header
    if ((0, lodash_1.isEmpty)(authHeader)) {
        return res.status(401).json({
            message: "Unauthorized.",
        });
    }
    // get clean token from header value
    const token = (_a = authHeader.authorization) === null || _a === void 0 ? void 0 : _a.substring(7);
    // handle case when post-processed token doesn't exist
    if (token === undefined || token === "") {
        return res.status(401).json({
            message: "Unauthorized.",
        });
    }
    // verify/decrypt the token
    let payload = {};
    try {
        payload = jsonwebtoken_1.default.verify(token, config_1.default.get("jwt-secret-key"));
    }
    catch (error) {
        return res.status(401).json({
            message: "Session expired. Please retry again.",
        });
    }
    // return res.status(200).json(payload);
    // get email from authorized user token
    const email = payload.userEmail;
    //get new password from req body
    const { newPassword } = (0, lodash_1.pick)(req.body, [
        "newPassword",
    ]);
    const userCredentials = {
        email: email,
        password: newPassword,
    };
    // check if such user exists
    const isRegistered = yield (0, portalDB_1.findUser)(userCredentials.email);
    // handle case when such user doesn't exist
    if (isRegistered === null) {
        const resEmailErrors = {
            message: "Account with such email doesn't exist.",
            errors: noEmailServerError,
        };
        return res.status(401).json(resEmailErrors);
    }
    // handle success case
    else if ("_id" in
        isRegistered) {
        // don't do anything; pass on to the next steps
    }
    // handle error case from findUser()
    else if ("message" in isRegistered) {
        return res.status(500).json({
            message: "INTERNAL ERROR!!! Couldn't find user. Please try again later.",
        });
        // error is to be passed to snackbar
    }
    // check if password exists in credentials
    if (!userCredentials.password) {
        const noPasswordError = (0, credentialValidation_1.checkPasswordErrors)("");
        const resPasswordErrors = {
            message: "No password provided.",
            errors: noPasswordError,
        };
        return res.status(401).json(resPasswordErrors);
        // error is to be passed to the field
    }
    // check for password errors
    const passwordErrors = (0, credentialValidation_1.checkPasswordErrors)(userCredentials.password);
    if (!(0, credentialValidation_1.validatePassword)(passwordErrors)) {
        const resPasswordErrors = {
            message: "Invalid password.",
            errors: passwordErrors,
        };
        return res.status(401).json(resPasswordErrors);
        // error is to be passed to the field
    }
    // hash password
    let hashedUserCredentials = Object.assign({}, userCredentials);
    const salt = yield bcrypt_1.default.genSalt();
    hashedUserCredentials.password = yield bcrypt_1.default.hash(userCredentials.password, salt);
    // change password of found user
    const result = yield (0, portalDB_1.changePass)(hashedUserCredentials);
    // handle error case from createUser()
    if (result.message) {
        return res.status(500).json({
            message: "INTERNAL ERROR!!! Couldn't find user. Please try again later.",
        });
        // error is to be passed to snackbar
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
exports.default = router;
