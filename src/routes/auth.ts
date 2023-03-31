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
import { pick } from "lodash";

const router = express.Router();

interface ResCredentialErrors {
    message: string;
    errors: PasswordErrors | EmailErrors;
}

router.get("/", (req: Request, res: Response) => {
    res.status(200).send("Auth router works");
});

router.post("/register", async (req: Request, res: Response) => {
    let userCredentials: User = pick(req.body, ["email", "password"]);

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
        // don't do anything; pass on to the next steps
    } else if (
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

    // handle error case from createUser()
    if ((result as Error).message) {
        return res.status(500).send("INTERNAL ERROR!!! Couldn't find user.");
    }

    // handle success case from createUser()
    return res.status(200).send(req.body);
});

router.post("/login", async (req: Request, res: Response) => {
    let userCredentials: User = pick(req.body, ["email", "password"]);

    // check if email exists in req body
    if (!userCredentials.email) {
        const resEmailErrors: ResCredentialErrors = {
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
    const emailErrors = checkEmailErrors(userCredentials.email);
    if (!validateEmail(emailErrors)) {
        const resEmailErrors: ResCredentialErrors = {
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
    const isRegistered = await findUser(userCredentials.email);

    let hashedPass = "";
    // handle case when such user exists
    if (isRegistered === null) {
        const resEmailErrors: ResCredentialErrors = {
            message: "Account with such email doesn't exist.",
            errors: {
                noEmailServer: true,
                invalidEmailForm: false,
                alreadyExists: false,
            },
        };
        return res.status(401).send(resEmailErrors);
    } else if (
        "_id" in
        (isRegistered as unknown as mongoose.Document<
            mongoose.Types.ObjectId,
            any,
            User
        >)
    ) {
        // don't do anything; pass on to the next steps
        // mongoose.Schema<User>
        // return res.status(200).send((isRegistered as unknown as User).password);
        hashedPass = (isRegistered as unknown as User).password;
    }
    // handle error case from findUser()
    else if ("message" in (isRegistered as unknown as Error)) {
        return res.status(500).send("INTERNAL ERROR!!! Couldn't find user.");
    }

    // check if password exists
    if (!userCredentials.password) {
        // const noPasswordError = checkPasswordErrors("");
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
        return res.status(401).send(resPasswordErrors);
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
        return res.status(401).send(resPasswordErrors);
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
        return res.status(401).send(resPasswordErrors);
    } else {
        return res.status(200).send(req.body);
    }
});

export default router;
