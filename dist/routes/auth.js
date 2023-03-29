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
const router = express_1.default.Router();
router.get("/", (req, res) => {
    res.status(200).send("Auth router works");
});
router.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("req body post to api", req.body);
    // hash password
    let userCredentials = Object.assign({}, req.body);
    const salt = yield bcrypt_1.default.genSalt();
    userCredentials.password = yield bcrypt_1.default.hash(userCredentials.password, salt);
    // create user
    const result = yield (0, authDB_1.createUser)(userCredentials);
    console.log("result register api post", result);
    // handle error case from createUser()
    if (result.name) {
        return res
            .status(500)
            .send("INTERNAL ERROR!!! Couldn't create new user.");
    }
    // handle success case from createUser()
    return res.status(200).send(result);
}));
exports.default = router;
