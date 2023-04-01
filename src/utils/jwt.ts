import jwt from "jsonwebtoken";
import config from "config";

export const generateAccessTokenApp = (userEmail: string) => {
    return jwt.sign(
        {
            isUser: true,
            userEmail: userEmail,
        },
        config.get("jwt-secret-key"),
        { expiresIn: "1d" }
    );
};

export const generateAccessTokenCode = (payload: {
    email: string;
    password?: string;
    verificationCode: string;
}) => {
    return jwt.sign(
        payload,
        config.get("jwt-secret-key"),
        { expiresIn: "30m" }
    );
};

