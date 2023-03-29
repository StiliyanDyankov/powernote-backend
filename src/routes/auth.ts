import express, { Request, Response } from "express";
import { createUser, User } from "../db/authDB";
import bcrypt from "bcrypt";

const router = express.Router();

router.get("/", (req: Request, res: Response) => {
    res.status(200).send("Auth router works");
});

router.post("/register", async (req: Request, res: Response) => {
    console.log("req body post to api", req.body);

    

    // hash password
    let userCredentials = { ...req.body };
    const salt = await bcrypt.genSalt();
    userCredentials.password = await bcrypt.hash(
        userCredentials.password,
        salt
    );

    // create user
    const result = await createUser(userCredentials);

    console.log("result register api post", result);

    // handle error case from createUser()
    if ((result as Error).name) {
        return res
            .status(500)
            .send("INTERNAL ERROR!!! Couldn't create new user.");
    }

    // handle success case from createUser()
    return res.status(200).send(result as User);
});

export default router;
