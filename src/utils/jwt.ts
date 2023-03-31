import jwt from "jsonwebtoken";
import config from "config";

const generateAccessToken = (userEmail: string) => {
    return jwt.sign(
        {
            userEmail: userEmail,
            isUser: true,
        },
        config.get("jwt-secret-key"),
        { expiresIn: "1d" }
    );
};
