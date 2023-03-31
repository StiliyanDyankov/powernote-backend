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
const router = express_1.default.Router();
router.get("/", (req, res) => {
    res.status(200).send("Auth router works");
});
router.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let userCredentials = (0, lodash_1.pick)(req.body, ["email", "password"]);
    // check if email exists in req body
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
    // handle case when such user exists
    if (isRegistered === null) {
        // don't do anything; pass on to the next steps
    }
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
    // check if password exists
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
    const salt = yield bcrypt_1.default.genSalt();
    userCredentials.password = yield bcrypt_1.default.hash(userCredentials.password, salt);
    // create user
    const result = yield (0, authDB_1.createUser)(userCredentials);
    // handle error case from createUser()
    if (result.message) {
        return res.status(500).send("INTERNAL ERROR!!! Couldn't find user.");
    }
    // handle success case from createUser()
    return res.status(200).send(req.body);
}));
router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let userCredentials = (0, lodash_1.pick)(req.body, ["email", "password"]);
    // check if email exists in req body
    if (!userCredentials.email) {
        const resEmailErrors = {
            message: "No email provided.",
            errors: {
                noEmailServer: true,
                invalidEmailForm: false,
                alreadyExists: false,
            },
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
            errors: {
                noEmailServer: true,
                invalidEmailForm: false,
                alreadyExists: false,
            },
        };
        return res.status(401).send(resEmailErrors);
    }
    // check if such user exists
    const isRegistered = yield (0, authDB_1.findUser)(userCredentials.email);
    let hashedPass = "";
    // handle case when such user exists
    if (isRegistered === null) {
        const resEmailErrors = {
            message: "Account with such email doesn't exist.",
            errors: {
                noEmailServer: true,
                invalidEmailForm: false,
                alreadyExists: false,
            },
        };
        return res.status(401).send(resEmailErrors);
    }
    else if ("_id" in
        isRegistered) {
        // don't do anything; pass on to the next steps
        // mongoose.Schema<User>
        // return res.status(200).send((isRegistered as unknown as User).password);
        hashedPass = isRegistered.password;
    }
    // handle error case from findUser()
    else if ("message" in isRegistered) {
        return res.status(500).send("INTERNAL ERROR!!! Couldn't find user.");
    }
    // check if password exists
    if (!userCredentials.password) {
        // const noPasswordError = checkPasswordErrors("");
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
    else {
        return res.status(200).send(req.body);
    }
}));
exports.default = router;
