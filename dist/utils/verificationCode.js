"use strict";
// a function, which takes as arg the payload from the req
// in the first case - email - , second - email and password
// outputs a jwt, which contains as payload:
// - the given credentials passed to it as args
// - the authCode
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleVerificationCode = void 0;
const lodash_1 = require("lodash");
const jwt_1 = require("./jwt");
const mailingService_1 = require("./mailingService");
const handleVerificationCode = (payload) => {
    // generate verification code
    const verificationCode = (0, lodash_1.random)(10000, 99999).toString();
    // trigger email service - send code
    (0, mailingService_1.sendEmail)(payload.email, verificationCode);
    // generate jwt with given payload
    let intPayload = (0, lodash_1.merge)(payload, { verificationCode });
    const jwt = (0, jwt_1.generateAccessTokenCode)(intPayload);
    // return jwt
    return jwt;
};
exports.handleVerificationCode = handleVerificationCode;
