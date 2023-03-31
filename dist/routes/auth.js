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
const router = express_1.default.Router();
router.get("/", (req, res) => {
    res.status(200).send("Auth router works");
});
router.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("req body post to api", req.body);
    // TODO: Add validation with joi
    let userCredentials = Object.assign({}, req.body);
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
    }
    else if ("_id" in isRegistered) {
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
    console.log("result register api post", result);
    // handle error case from createUser()
    if (result.message) {
        return res
            .status(500)
            .send("INTERNAL ERROR!!! Couldn't create new user.");
    }
    // handle success case from createUser()
    return res.status(200).send(req.body);
}));
exports.default = router;
