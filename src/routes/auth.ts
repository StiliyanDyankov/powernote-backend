import express, { Request, Response } from "express";
import { createUser, findUser, User } from "../db/authDB";
import bcrypt from "bcrypt";

const router = express.Router();

router.get("/", (req: Request, res: Response) => {
    res.status(200).send("Auth router works");
});

router.post("/register", async (req: Request, res: Response) => {
    // TODO: Add validation with joi
    console.log("req body post to api", req.body);

    let userCredentials: User = { ...req.body };

    const isRegistered = await findUser(userCredentials.email);

    // handle error case from findUser()
    if ((isRegistered as Error).message) {
        return res
            .status(500)
            .send("INTERNAL ERROR!!! Couldn't create new user.");
    } 
    // handle case when such user exists
    else if (isRegistered !== null) {
        return res.status(409).send("Account with such email already exists.");
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
    return res.status(200).send(result as User);
});

export default router;
