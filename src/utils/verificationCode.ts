// a function, which takes as arg the payload from the req
// in the first case - email - , second - email and password
// outputs a jwt, which contains as payload:
// - the given credentials passed to it as args
// - the authCode

import { merge, random } from "lodash";
import { generateAccessTokenCode } from "./jwt";

export const handleVerificationCode = (payload: {
    email: string;
    password?: string;
}) => {
    // generate verification code
    const verificationCode = random(10000, 99999).toString();

    // trigger email service - send code

    // generate jwt with given payload
    let intPayload = merge(payload, { verificationCode });
    const jwt = generateAccessTokenCode(intPayload);

    // return jwt
    return jwt
};
