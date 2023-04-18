"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmail = exports.checkEmailErrors = exports.emailFormSchema = exports.validatePassword = exports.checkPasswordErrors = exports.passwordFormSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.passwordFormSchema = joi_1.default.string()
    .pattern(new RegExp("^.{8,19}$"), "length")
    .pattern(new RegExp("[0-9]"), "number")
    .pattern(new RegExp("[a-z]"), "lowercase")
    .pattern(new RegExp("[A-Z]"), "uppercase")
    .pattern(new RegExp("[^a-zA-Z0-9s\n]"), "special");
const checkPasswordErrors = (password) => {
    let intErrors = {
        noPasswordServer: false,
        noLength: false,
        noUppercase: false,
        noLowercase: false,
        noNumber: false,
        noSymbol: false,
    };
    const validationRes = exports.passwordFormSchema.validate(password, {
        abortEarly: false,
    });
    if (typeof validationRes.error === "undefined") {
        return intErrors;
    }
    else if (validationRes.error.details[0].type === "string.empty") {
        intErrors.noLength = true;
    }
    else {
        validationRes.error.details.forEach((d) => {
            var _a, _b, _c, _d, _e;
            if (((_a = d.context) === null || _a === void 0 ? void 0 : _a.name) === "length") {
                intErrors.noLength = true;
            }
            if (((_b = d.context) === null || _b === void 0 ? void 0 : _b.name) === "number") {
                intErrors.noNumber = true;
            }
            if (((_c = d.context) === null || _c === void 0 ? void 0 : _c.name) === "lowercase") {
                intErrors.noLowercase = true;
            }
            if (((_d = d.context) === null || _d === void 0 ? void 0 : _d.name) === "uppercase") {
                intErrors.noUppercase = true;
            }
            if (((_e = d.context) === null || _e === void 0 ? void 0 : _e.name) === "special") {
                intErrors.noSymbol = true;
            }
        });
    }
    return intErrors;
};
exports.checkPasswordErrors = checkPasswordErrors;
const validatePassword = (errors) => {
    for (const err in errors) {
        if (Object.prototype.hasOwnProperty.call(errors, err)) {
            if (errors[err])
                return false;
        }
    }
    return true;
};
exports.validatePassword = validatePassword;
exports.emailFormSchema = joi_1.default.string().email({
    tlds: { allow: false },
});
const checkEmailErrors = (email) => {
    let intErrors = {
        noEmailServer: false,
        invalidEmailForm: false,
        alreadyExists: false,
    };
    const validationRes = exports.emailFormSchema.validate(email);
    if (typeof validationRes.error === "undefined") {
        return intErrors;
    }
    else {
        intErrors.invalidEmailForm = true;
        return intErrors;
    }
};
exports.checkEmailErrors = checkEmailErrors;
const validateEmail = (errors) => {
    for (const err in errors) {
        if (Object.prototype.hasOwnProperty.call(errors, err)) {
            if (errors[err])
                return false;
        }
    }
    return true;
};
exports.validateEmail = validateEmail;
