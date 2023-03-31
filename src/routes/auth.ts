import express, { Request, Response } from "express";
import { createUser, findUser, User } from "../db/authDB";
import bcrypt from "bcrypt";
import {
    checkEmailErrors,
    checkPasswordErrors,
    PasswordErrors,
    validateEmail,
    validatePassword,
} from "../utils/authValidation";
import { EmailErrors } from "./../utils/authValidation";
import mongoose from "mongoose";

const router = express.Router();

interface ResCredentialErrors {
    message: string;
    errors: PasswordErrors | EmailErrors;
}

router.get("/", (req: Request, res: Response) => {
    res.status(200).send("Auth router works");
});

router.post("/register", async (req: Request, res: Response) => {
    console.log("req body post to api", req.body);
    // TODO: Add validation with joi

    let userCredentials: User = { ...req.body };

    // check if email exists in req body
    if (!userCredentials.email) {
        const unprovidedEmailError = checkEmailErrors("");
        const resEmailErrors: ResCredentialErrors = {
            message: "No email provided.",
            errors: unprovidedEmailError,
        };
        return res.status(401).send(resEmailErrors);
    }

    // check for email errors
    const emailErrors = checkEmailErrors(userCredentials.email);
    if (!validateEmail(emailErrors)) {
        const resEmailErrors: ResCredentialErrors = {
            message: "Invalid email.",
            errors: emailErrors,
        };
        return res.status(401).send(resEmailErrors);
    }
    
    // check if such user exists
    const isRegistered = await findUser(userCredentials.email);

    // handle case when such user exists
    if (isRegistered === null) {
    } else if (
        "_id" in (isRegistered as unknown as { _id: mongoose.Types.ObjectId })
    ) {
        const resEmailErrors: ResCredentialErrors = {
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
    else if ("message" in (isRegistered as unknown as Error)) {
        return res
            .status(500)
            .send("INTERNAL ERROR!!! Couldn't create new user.");
    }
    
    // check if password exists
    if (!userCredentials.password) {
        const noPasswordError = checkPasswordErrors("");
        const resPasswordErrors: ResCredentialErrors = {
            message: "No password provided.",
            errors: noPasswordError,
        };
        return res.status(401).send(resPasswordErrors);
    }

    // check for password errors
    const passwordErrors = checkPasswordErrors(userCredentials.password);
    if (!validatePassword(passwordErrors)) {
        const resPasswordErrors: ResCredentialErrors = {
            message: "Invalid password.",
            errors: passwordErrors,
        };
        return res.status(401).send(resPasswordErrors);
    }

    // hash password
    const salt = await bcrypt.genSalt();
    userCredentials.password = await bcrypt.hash(
        userCredentials.password,
        salt
    );

    // create user
    const result = await createUser(userCredentials);

    console.log("result register api post", result);

    // handle error case from createUser()
    if ((result as Error).message) {
        return res
            .status(500)
            .send("INTERNAL ERROR!!! Couldn't create new user.");
    }

    // handle success case from createUser()
    return res.status(200).send(req.body);
});

export default router;
