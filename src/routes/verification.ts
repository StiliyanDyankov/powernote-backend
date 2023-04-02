import express, { NextFunction, Request, Response } from "express";
import { isEmpty, pick } from "lodash";
import jwt from "jsonwebtoken";
import config from "config";
import { User, createUser } from "../db/portalDB";
import bcrypt from "bcrypt";
import { generateAccessTokenApp } from "../utils/jwt";
import { handleVerificationCode } from "../utils/verificationCode";

const router = express.Router();

interface ExpPayload extends User {
    verificationCode: string;
    iat: number;
    exp: number;
}

// request contains verification code in body
// request contains already validated user credentials in jwt, either:
// - password and email in case of register;
// - email in case of forgot;
// in any case contains generated from server verification code in jwt
// ---------------------------------
// validates verification code
// in case of success, appends stored in jwt credentials in req body and passes on
const validateReq = (req: Request, res: Response, next: NextFunction) => {
    // get header containing the token
    const authHeader = pick(req.headers, ["authorization"]);
    const providedCode = pick(req.body, ["verificationCode"]);

    // handle case when there is no such header
    if (isEmpty(authHeader)) {
        return res.status(401).json({
            message: "Unauthorized.",
        });
    }

    // handle case when there is no verification code
    if (isEmpty(providedCode)) {
        return res.status(409).json({
            message: "No verification code provided",
        });
    }

    // get only the contents of the header and clean it to get token
    const token = authHeader.authorization?.substring(7);

    // handle case when the actual token doesn't exist in the string
    if (token === undefined || token === "") {
        return res.status(401).json({
            message: "Unauthorized.",
        });
    }

    // handle case when verification code is empty
    if (
        typeof providedCode.verificationCode !== "string" &&
        (providedCode.verificationCode as string).length !== 5
    ) {
        return res.status(409).json({
            message: "Invalid verification code",
        });
    }

    // decrypt jwt to get payload
    let payload: jwt.JwtPayload | string = {};
    try {
        payload = jwt.verify(token, config.get("jwt-secret-key"));
    } catch (error: any) {
        return res.status(401).json({
            message: "Session expired. Please retry again.",
        });
    }

    // return res.status(200).send(payload);

    // compare code in jwt payload to the one provided by user
    if (
        (payload as ExpPayload).verificationCode !==
        providedCode.verificationCode
    ) {
        return res.status(409).json({
            message: "Invalid verification code",
            errors: {
                error: true,
            },
        });
    } else {
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
router.post("/resendCode", async (req: Request, res: Response) => {
    // get header containing the token
    const authHeader = pick(req.headers, ["authorization"]);

    // handle case when there is no such header
    if (isEmpty(authHeader)) {
        return res.status(401).json({
            message: "Unauthorized.",
        });
    }
    
    // get only the contents of the header and clean it to get token
    const token = authHeader.authorization?.substring(7);

    // handle case when the actual token doesn't exist in the string
    if (token === undefined || token === "") {
        return res.status(401).json({
            message: "Unauthorized.",
        });
    }

    // decrypt jwt to get payload
    let payload: jwt.JwtPayload | string = {};
    try {
        payload = jwt.verify(token, config.get("jwt-secret-key"));
    } catch (error: any) {
        return res.status(401).json({
            message: "Session expired. Please retry again.",
        });
    }

    // get user credentials from jwt
    const userCredentials: User = pick((payload as ExpPayload), ["email", "password"])

    // return new token
    const newToken = handleVerificationCode(userCredentials);
    return res.status(200).json({
        message: "Authentication successful!",
        token: "Bearer " + newToken,
    });
});

// contains validated by middleware credentials in body
// creates user
router.post("/register", validateReq, async (req: Request, res: Response) => {
    let userCredentials: User = pick(req.body, ["email", "password"]);

    let hashedUserCredentials: User = { ...userCredentials };
    const salt = await bcrypt.genSalt();
    hashedUserCredentials.password = await bcrypt.hash(
        userCredentials.password,
        salt
    );

    // create user
    const result = await createUser(hashedUserCredentials);

    // handle error case from createUser()
    if ((result as Error).message) {
        return res.status(500).json({
            message: "User already registered.",
        });
    } else {
        // handle success case from createUser()
        return res.status(200).json(userCredentials);
    }
});

// get valid email from decrypted jwt
// return authorized user token, to be used in submitting new pass
router.post("/forgot", validateReq, async (req: Request, res: Response) => {
    let userCredentials: { email: string } = pick(req.body, ["email"]);

    const token = generateAccessTokenApp(userCredentials.email);
    return res.status(200).json({
        message: "Authentication successful!",
        token: "Bearer " + token,
    });
});

export default router;
