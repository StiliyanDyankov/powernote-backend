import express, { Request, Response } from "express";
import { changePass, createUser, findUser, User } from "../db/authDB";
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

    // check if email exists in credentials
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
        return res.status(409).send(resEmailErrors);
    }
    // handle error case from findUser()
    else if ("message" in (isRegistered as unknown as Error)) {
        return res
            .status(500)
            .send("INTERNAL ERROR!!! Couldn't create new user.");
    }

    // check if password exists in credentials
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
    let hashedUserCredentials: User = { ...userCredentials };
    const salt = await bcrypt.genSalt();
    hashedUserCredentials.password = await bcrypt.hash(
        userCredentials.password,
        salt
    );

    // create user
    const result = await createUser(hashedUserCredentials);
    // TODO: Here should be validation code handling

    // handle error case from createUser()
    if ((result as Error).message) {
        return res.status(500).send("INTERNAL ERROR!!! Couldn't find user.");
    } else {
        // handle success case from createUser()
        return res.status(200).send(userCredentials);
    }
});

router.post("/login", async (req: Request, res: Response) => {
    let userCredentials: User = pick(req.body, ["email", "password"]);

    // check if email exists in credentials
    if (!userCredentials.email) {
        const resEmailErrors: ResCredentialErrors = {
            message: "No email provided.",
            errors: noEmailServerError,
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
            errors: noEmailServerError,
        };
        return res.status(401).send(resEmailErrors);
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
        return res.status(401).send(resEmailErrors);
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
        return res.status(500).send("INTERNAL ERROR!!! Couldn't find user.");
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
    }
    // handle success case
    else {
        return res.status(200).send(userCredentials);
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
        return res.status(401).send(resEmailErrors);
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
        return res.status(401).send(resEmailErrors);
    }

    // check if such user exists
    const isRegistered = await findUser(userCredentials.email);

    // handle case when such user doesn't exist
    if (isRegistered === null) {
        const resEmailErrors: ResCredentialErrors = {
            message: "Account with such email doesn't exist.",
            errors: noEmailServerError,
        };
        return res.status(401).send(resEmailErrors);
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
        // TODO: Here should be validation code handling
        return res.status(200).send(userCredentials);
    }
    // handle error case from findUser()
    else if ("message" in (isRegistered as unknown as Error)) {
        return res.status(500).send("INTERNAL ERROR!!! Couldn't find user.");
    }
    return res.status(500).send("INTERNAL ERROR!!! Couldn't find user.");
});

router.post("/forgot/changePass", async (req: Request, res: Response) => {
    let userCredentials: User = pick(req.body, ["email", "password"]);

    // check if email exists in credentials
    if (!userCredentials.email) {
        const resEmailErrors: ResCredentialErrors = {
            message: "No email provided.",
            errors: noEmailServerError,
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
            errors: noEmailServerError,
        };
        return res.status(401).send(resEmailErrors);
    }

    // check if such user exists
    const isRegistered = await findUser(userCredentials.email);

    // handle case when such user doesn't exist
    if (isRegistered === null) {
        const resEmailErrors: ResCredentialErrors = {
            message: "Account with such email doesn't exist.",
            errors: noEmailServerError,
        };
        return res.status(401).send(resEmailErrors);
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
        return res.status(500).send("INTERNAL ERROR!!! Couldn't find user.");
    }

    // check if password exists in credentials
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
    let hashedUserCredentials: User = { ...userCredentials };
    const salt = await bcrypt.genSalt();
    hashedUserCredentials.password = await bcrypt.hash(
        userCredentials.password,
        salt
    );

    // create user
    const result = await changePass(hashedUserCredentials);

    // handle error case from createUser()
    if ((result as Error).message) {
        return res.status(500).send("INTERNAL ERROR!!! Couldn't find user.");
    } else {
        // handle success case from createUser()
        return res.status(200).send(userCredentials);
    }
});

export default router;
