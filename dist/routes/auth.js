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
const authDB_1 = require("../db/authDB");
const bcrypt_1 = __importDefault(require("bcrypt"));
const authValidation_1 = require("../utils/authValidation");
const lodash_1 = require("lodash");
const verificationCode_1 = require("../utils/verificationCode");
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
        const unprovidedEmailError = (0, authValidation_1.checkEmailErrors)("");
        const resEmailErrors = {
            message: "No email provided.",
            errors: unprovidedEmailError,
        };
        return res.status(401).send(resEmailErrors);
    }
    // check for email errors
    const emailErrors = (0, authValidation_1.checkEmailErrors)(userCredentials.email);
    if (!(0, authValidation_1.validateEmail)(emailErrors)) {
        const resEmailErrors = {
            message: "Invalid email.",
            errors: emailErrors,
        };
        return res.status(401).send(resEmailErrors);
    }
    // check if such user exists
    const isRegistered = yield (0, authDB_1.findUser)(userCredentials.email);
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
        return res.status(409).send(resEmailErrors);
    }
    // handle error case from findUser()
    else if ("message" in isRegistered) {
        return res
            .status(500)
            .send("INTERNAL ERROR!!! Couldn't create new user.");
    }
    // check if password exists in credentials
    if (!userCredentials.password) {
        const noPasswordError = (0, authValidation_1.checkPasswordErrors)("");
        const resPasswordErrors = {
            message: "No password provided.",
            errors: noPasswordError,
        };
        return res.status(401).send(resPasswordErrors);
    }
    // check for password errors
    const passwordErrors = (0, authValidation_1.checkPasswordErrors)(userCredentials.password);
    if (!(0, authValidation_1.validatePassword)(passwordErrors)) {
        const resPasswordErrors = {
            message: "Invalid password.",
            errors: passwordErrors,
        };
        return res.status(401).send(resPasswordErrors);
    }
    // hash password
    // TODO: to be moved to the other endpoint where the actual write is exec
    let hashedUserCredentials = Object.assign({}, userCredentials);
    const salt = yield bcrypt_1.default.genSalt();
    hashedUserCredentials.password = yield bcrypt_1.default.hash(userCredentials.password, salt);
    // TODO: Here should be validation code handling
    // TODO: Here should be jwt issuing
    const token = (0, verificationCode_1.handleVerificationCode)({ email: userCredentials.email, password: userCredentials.password });
    return res.status(200).json({
        message: "Authentication successful!",
        token: "Bearer " + token,
    });
    // create user
    // const result = await createUser(hashedUserCredentials);
    // handle error case from createUser()
    // if ((result as Error).message) {
    //     return res.status(500).send("INTERNAL ERROR!!! Couldn't find user.");
    // } else {
    //     // handle success case from createUser()
    //     return res.status(200).send(userCredentials);
    // }
}));
router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let userCredentials = (0, lodash_1.pick)(req.body, ["email", "password"]);
    // check if email exists in credentials
    if (!userCredentials.email) {
        const resEmailErrors = {
            message: "No email provided.",
            errors: noEmailServerError,
        };
        return res.status(401).send(resEmailErrors);
    }
    // check for email errors
    // no validation needed for login UX
    // kept to protect against malicious attacks
    const emailErrors = (0, authValidation_1.checkEmailErrors)(userCredentials.email);
    if (!(0, authValidation_1.validateEmail)(emailErrors)) {
        const resEmailErrors = {
            message: "Account with such email doesn't exist.",
            errors: noEmailServerError,
        };
        return res.status(401).send(resEmailErrors);
    }
    // check if such user exists
    const isRegistered = yield (0, authDB_1.findUser)(userCredentials.email);
    // handle case when such user doesn't exist
    let hashedPass = "";
    if (isRegistered === null) {
        const resEmailErrors = {
            message: "Account with such email doesn't exist.",
            errors: noEmailServerError,
        };
        return res.status(401).send(resEmailErrors);
    }
    else if ("_id" in
        isRegistered) {
        hashedPass = isRegistered.password;
    }
    // handle error case from findUser()
    else if ("message" in isRegistered) {
        return res.status(500).send("INTERNAL ERROR!!! Couldn't find user.");
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
        return res.status(401).send(resPasswordErrors);
    }
    // check for password errors
    // no validation needed for login UX
    // kept to protect against malicious attacks
    const passwordErrors = (0, authValidation_1.checkPasswordErrors)(userCredentials.password);
    if (!(0, authValidation_1.validatePassword)(passwordErrors)) {
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
        return res.status(401).send(resPasswordErrors);
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
        return res.status(401).send(resPasswordErrors);
    }
    // handle success case
    else {
        return res.status(200).send(userCredentials);
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
        return res.status(401).send(resEmailErrors);
    }
    // check for email errors
    // no validation needed for auth UX
    // kept to protect against malicious attacks
    const emailErrors = (0, authValidation_1.checkEmailErrors)(userCredentials.email);
    if (!(0, authValidation_1.validateEmail)(emailErrors)) {
        const resEmailErrors = {
            message: "Account with such email doesn't exist.",
            errors: noEmailServerError,
        };
        return res.status(401).send(resEmailErrors);
    }
    // check if such user exists
    const isRegistered = yield (0, authDB_1.findUser)(userCredentials.email);
    // handle case when such user doesn't exist
    if (isRegistered === null) {
        const resEmailErrors = {
            message: "Account with such email doesn't exist.",
            errors: noEmailServerError,
        };
        return res.status(401).send(resEmailErrors);
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
        return res.status(500).send("INTERNAL ERROR!!! Couldn't find user.");
    }
    return res.status(500).send("INTERNAL ERROR!!! Couldn't find user.");
}));
router.post("/forgot/changePass", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let userCredentials = (0, lodash_1.pick)(req.body, ["email", "password"]);
    // check if email exists in credentials
    if (!userCredentials.email) {
        const resEmailErrors = {
            message: "No email provided.",
            errors: noEmailServerError,
        };
        return res.status(401).send(resEmailErrors);
    }
    // check for email errors
    // no validation needed for login UX
    // kept to protect against malicious attacks
    const emailErrors = (0, authValidation_1.checkEmailErrors)(userCredentials.email);
    if (!(0, authValidation_1.validateEmail)(emailErrors)) {
        const resEmailErrors = {
            message: "Account with such email doesn't exist.",
            errors: noEmailServerError,
        };
        return res.status(401).send(resEmailErrors);
    }
    // check if such user exists
    const isRegistered = yield (0, authDB_1.findUser)(userCredentials.email);
    // handle case when such user doesn't exist
    if (isRegistered === null) {
        const resEmailErrors = {
            message: "Account with such email doesn't exist.",
            errors: noEmailServerError,
        };
        return res.status(401).send(resEmailErrors);
    }
    // handle success case
    else if ("_id" in
        isRegistered) {
        // don't do anything; pass on to the next steps
    }
    // handle error case from findUser()
    else if ("message" in isRegistered) {
        return res.status(500).send("INTERNAL ERROR!!! Couldn't find user.");
    }
    // check if password exists in credentials
    if (!userCredentials.password) {
        const noPasswordError = (0, authValidation_1.checkPasswordErrors)("");
        const resPasswordErrors = {
            message: "No password provided.",
            errors: noPasswordError,
        };
        return res.status(401).send(resPasswordErrors);
    }
    // check for password errors
    const passwordErrors = (0, authValidation_1.checkPasswordErrors)(userCredentials.password);
    if (!(0, authValidation_1.validatePassword)(passwordErrors)) {
        const resPasswordErrors = {
            message: "Invalid password.",
            errors: passwordErrors,
        };
        return res.status(401).send(resPasswordErrors);
    }
    // hash password
    let hashedUserCredentials = Object.assign({}, userCredentials);
    const salt = yield bcrypt_1.default.genSalt();
    hashedUserCredentials.password = yield bcrypt_1.default.hash(userCredentials.password, salt);
    // create user
    const result = yield (0, authDB_1.changePass)(hashedUserCredentials);
    // handle error case from createUser()
    if (result.message) {
        return res.status(500).send("INTERNAL ERROR!!! Couldn't find user.");
    }
    else {
        // handle success case from createUser()
        return res.status(200).send(userCredentials);
    }
}));
exports.default = router;
