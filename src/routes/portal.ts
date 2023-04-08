import express, { Request, Response } from "express";
import { changePass, findUser, User } from "../db/portalDB";
import bcrypt from "bcrypt";
import {
    checkEmailErrors,
    checkPasswordErrors,
    PasswordErrors,
    validateEmail,
    validatePassword,
} from "../utils/credentialValidation";
import { EmailErrors } from "../utils/credentialValidation";
import mongoose from "mongoose";
import { isEmpty, pick } from "lodash";
import { handleVerificationCode } from "../utils/verificationCode";
import jwt from "jsonwebtoken";
import config from "config";
import { generateAccessTokenApp } from "../utils/jwt";

const router = express.Router();

interface ResCredentialErrors {
    message: string;
    errors: PasswordErrors | EmailErrors;
}

interface TokenPayloadApp {
    isUser: boolean;
    userEmail: string;
    iat: number;
    exp: number;
}

const noEmailServerError = {
    noEmailServer: true,
    invalidEmailForm: false,
    alreadyExists: false,
};

router.get("/", (req: Request, res: Response) => {
    res.status(200).send("Auth router works");
});

router.post("/register", async (req: Request, res: Response) => {
    let userCredentials: User = pick(req.body, ["email", "password"]);

    console.log(userCredentials);

    // check if email exists in credentials
    if (!userCredentials.email) {
        const unprovidedEmailError = checkEmailErrors("");
        const resEmailErrors: ResCredentialErrors = {
            message: "No email provided.",
            errors: unprovidedEmailError,
        };
        return res.status(401).json(resEmailErrors);
        // error is to be passed to the field
    }

    // check for email errors
    const emailErrors = checkEmailErrors(userCredentials.email);
    if (!validateEmail(emailErrors)) {
        const resEmailErrors: ResCredentialErrors = {
            message: "Invalid email.",
            errors: emailErrors,
        };
        return res.status(401).json(resEmailErrors);
        // error is to be passed to the field
    }

    // check if such user exists
    const isRegistered = await findUser(userCredentials.email);

    // handle case when such user doesn't exist
    if (isRegistered === null) {
        // don't do anything; pass on to the next steps
    }
    // handle case when such user exists
    else if (
        "_id" in
        (isRegistered as unknown as mongoose.Document<
            mongoose.Types.ObjectId,
            any,
            User
        >)
    ) {
        const resEmailErrors: ResCredentialErrors = {
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
    else if ("message" in (isRegistered as unknown as Error)) {
        return res.status(500).json({
            message:
                "INTERNAL ERROR!!! Couldn't create new user. Please try again later.",
        });
        // error is to be passed to snackbar
    }

    // check if password exists in credentials
    if (!userCredentials.password) {
        const noPasswordError = checkPasswordErrors("");
        const resPasswordErrors: ResCredentialErrors = {
            message: "No password provided.",
            errors: noPasswordError,
        };
        return res.status(401).json(resPasswordErrors);
        // error is to be passed to the field
    }

    // check for password errors
    const passwordErrors = checkPasswordErrors(userCredentials.password);
    if (!validatePassword(passwordErrors)) {
        const resPasswordErrors: ResCredentialErrors = {
            message: "Invalid password.",
            errors: passwordErrors,
        };
        return res.status(401).json(resPasswordErrors);
        // error is to be passed to the field
    }

    // Here should be validation code handling
    // Here should be jwt issuing
    const token = handleVerificationCode({
        email: userCredentials.email,
        password: userCredentials.password,
    });
    return res.status(200).json({
        message: "Authentication successful!",
        token: "Bearer " + token,
    });
});

router.post("/login", async (req: Request, res: Response) => {
    let userCredentials: User = pick(req.body, ["email", "password"]);

    // check if email exists in credentials
    if (!userCredentials.email) {
        const resEmailErrors: ResCredentialErrors = {
            message: "No email provided.",
            errors: noEmailServerError,
        };
        return res.status(401).json(resEmailErrors);
        // error is to be passed to the field
    }

    // check for email errors
    // no validation needed for login UX
    // kept to protect against malicious attacks
    const emailErrors = checkEmailErrors(userCredentials.email);
    if (!validateEmail(emailErrors)) {
        const resEmailErrors: ResCredentialErrors = {
            message: "Account with such email doesn't exist.",
            errors: noEmailServerError,
        };
        return res.status(401).json(resEmailErrors);
        // error is to be passed to the field
    }

    // check if such user exists
    const isRegistered = await findUser(userCredentials.email);

    // handle case when such user doesn't exist
    let hashedPass = "";
    if (isRegistered === null) {
        const resEmailErrors: ResCredentialErrors = {
            message: "Account with such email doesn't exist.",
            errors: noEmailServerError,
        };
        return res.status(401).json(resEmailErrors);
        // error is to be passed to the field
    } else if (
        "_id" in
        (isRegistered as unknown as mongoose.Document<
            mongoose.Types.ObjectId,
            any,
            User
        >)
    ) {
        hashedPass = (isRegistered as unknown as User).password;
    }
    // handle error case from findUser()
    else if ("message" in (isRegistered as unknown as Error)) {
        return res.status(500).json({
            message:
                "INTERNAL ERROR!!! Couldn't find user. Please try again later.",
        });
        // error is to be passed to snackbar;
    }

    // check if password exists
    if (!userCredentials.password) {
        const resPasswordErrors: ResCredentialErrors = {
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
    const passwordErrors = checkPasswordErrors(userCredentials.password);
    if (!validatePassword(passwordErrors)) {
        const resPasswordErrors: ResCredentialErrors = {
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
        passIsValid = await bcrypt.compare(
            userCredentials.password,
            hashedPass
        );
    }

    // handle password validation paths
    if (!passIsValid) {
        const resPasswordErrors: ResCredentialErrors = {
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
        const token = generateAccessTokenApp(userCredentials.email);
        return res.status(200).json({
            message: "Authentication successful!",
            token: "Bearer " + token,
        });
    }
});

router.post("/forgot/emailAuth", async (req: Request, res: Response) => {
    let userCredentials: { email: string } = pick(req.body, ["email"]);

    // check if email exists in credentials
    if (!userCredentials.email) {
        const resEmailErrors: ResCredentialErrors = {
            message: "No email provided.",
            errors: noEmailServerError,
        };
        return res.status(401).json(resEmailErrors);
        // error is to be passed to the field
    }

    // check for email errors
    // no validation needed for auth UX
    // kept to protect against malicious attacks
    const emailErrors = checkEmailErrors(userCredentials.email);
    if (!validateEmail(emailErrors)) {
        const resEmailErrors: ResCredentialErrors = {
            message: "Account with such email doesn't exist.",
            errors: noEmailServerError,
        };
        return res.status(401).json(resEmailErrors);
        // error is to be passed to the field
    }

    // check if such user exists
    const isRegistered = await findUser(userCredentials.email);

    // handle case when such user doesn't exist
    if (isRegistered === null) {
        const resEmailErrors: ResCredentialErrors = {
            message: "Account with such email doesn't exist.",
            errors: noEmailServerError,
        };
        return res.status(401).json(resEmailErrors);
        // error is to be passed to the field
    }
    // handle success case
    else if (
        "_id" in
        (isRegistered as unknown as mongoose.Document<
            mongoose.Types.ObjectId,
            any,
            User
        >)
    ) {
        // Here should be validation code handling
        // Here should be jwt issuing
        const token = handleVerificationCode({ email: userCredentials.email });
        return res.status(200).json({
            message: "Authentication successful!",
            token: "Bearer " + token,
        });
    }
    // handle error case from findUser()
    else if ("message" in (isRegistered as unknown as Error)) {
        return res.status(500).json({
            message:
                "INTERNAL ERROR!!! Couldn't find user. Please try again later.",
        });
        // error is to be passed to snackbar;
    }
    return res.status(500).json({
        message:
            "INTERNAL ERROR!!! Couldn't find user. Please try again later.",
    });
    // error is to be passed to snackbar;
});

// req contains jwt in header - authorized as valid user
router.post("/forgot/changePass", async (req: Request, res: Response) => {
    const authHeader = pick(req.headers, ["authorization"]);

    // handle case when there is no such header
    if (isEmpty(authHeader)) {
        return res.status(401).json({
            message: "Unauthorized.",
        });
    }

    // get clean token from header value
    const token = authHeader.authorization?.substring(7);

    // handle case when post-processed token doesn't exist
    if (token === undefined || token === "") {
        return res.status(401).json({
            message: "Unauthorized.",
        });
    }

    // verify/decrypt the token
    let payload: jwt.JwtPayload | string = {};
    try {
        payload = jwt.verify(token, config.get("jwt-secret-key"));
    } catch (error: any) {
        return res.status(401).json({
            message: "Session expired. Please retry again.",
        });
    }

    // return res.status(200).json(payload);

    // get email from authorized user token
    const email = (payload as TokenPayloadApp).userEmail;
    //get new password from req body
    const { newPassword }: { newPassword: string } = pick(req.body, [
        "newPassword",
    ]);

    const userCredentials: User = {
        email: email,
        password: newPassword,
    };

    // check if such user exists
    const isRegistered = await findUser(userCredentials.email);

    // handle case when such user doesn't exist
    if (isRegistered === null) {
        const resEmailErrors: ResCredentialErrors = {
            message: "Account with such email doesn't exist.",
            errors: noEmailServerError,
        };
        return res.status(401).json(resEmailErrors);
    }
    // handle success case
    else if (
        "_id" in
        (isRegistered as unknown as mongoose.Document<
            mongoose.Types.ObjectId,
            any,
            User
        >)
    ) {
        // don't do anything; pass on to the next steps
    }
    // handle error case from findUser()
    else if ("message" in (isRegistered as unknown as Error)) {
        return res.status(500).json({
            message:
                "INTERNAL ERROR!!! Couldn't find user. Please try again later.",
        });
        // error is to be passed to snackbar
    }

    // check if password exists in credentials
    if (!userCredentials.password) {
        const noPasswordError = checkPasswordErrors("");
        const resPasswordErrors: ResCredentialErrors = {
            message: "No password provided.",
            errors: noPasswordError,
        };
        return res.status(401).json(resPasswordErrors);
        // error is to be passed to the field
    }

    // check for password errors
    const passwordErrors = checkPasswordErrors(userCredentials.password);
    if (!validatePassword(passwordErrors)) {
        const resPasswordErrors: ResCredentialErrors = {
            message: "Invalid password.",
            errors: passwordErrors,
        };
        return res.status(401).json(resPasswordErrors);
        // error is to be passed to the field
    }

    // hash password
    let hashedUserCredentials: User = { ...userCredentials };
    const salt = await bcrypt.genSalt();
    hashedUserCredentials.password = await bcrypt.hash(
        userCredentials.password,
        salt
    );

    // change password of found user
    const result = await changePass(hashedUserCredentials);

    // handle error case from createUser()
    if ((result as Error).message) {
        return res.status(500).json({
            message:
                "INTERNAL ERROR!!! Couldn't find user. Please try again later.",
        });
        // error is to be passed to snackbar
    } else {
        // handle success case from createUser()
        return res.status(200).json(userCredentials);
    }
});

export default router;
