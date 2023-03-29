import express, { Request, Response } from "express";
import { createUser, User } from "../db/authDB";

const router = express.Router();



router.get("/", (req: Request, res: Response) => {
    res.status(200).send("Auth router works");
})

router.post("/register", async (req: Request, res: Response) => {
    console.log("req body post to api", req.body);
    
    // create user
    const result = await createUser(req.body);
    
    console.log("result register api post", result);
    if((result as Error).name) {
        return res.status(500).send("INTERNAL ERROR!!! Couldn't create new user.");
    }
    return res.status(200).send(result as User);
})

export default router;