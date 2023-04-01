import express, { NextFunction, Request, Response } from "express";
import { isEmpty, pick } from "lodash";
import jwt from "jsonwebtoken";
import config from "config";
import { User, createUser } from "../db/portalDB";
import bcrypt from "bcrypt";
import { generateAccessTokenApp } from "../utils/jwt";

const router = express.Router();

interface ExpPayload extends User {
    verificationCode: string;
    iat: number;
    exp: number;
}

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
        });
    } else {
        req.body = payload;
        next();
        return;
    }
};

// request contains verification code in body
// request contains jwt in header
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
        return res.status(200).send(userCredentials);
    }
});

router.post("/forgot", validateReq, async (req: Request, res: Response) => {
    let userCredentials: { email: string } = pick(req.body, ["email"]);

    const token = generateAccessTokenApp(userCredentials.email);
    return res.status(200).json({
        message: "Authentication successful!",
        token: "Bearer " + token,
    });
});

export default router;
