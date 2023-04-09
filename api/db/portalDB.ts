import mongoose from "mongoose";
// import config from "config";

mongoose.set("strictQuery", false);

// const db: string = config.get("db");

// const connectDb = async () => {
//     try {
//         console.log(db);
//         await mongoose.connect(db);
//     } catch (e: unknown) {
//         console.log(e);
//     }
//     console.log(`[db]: db is running at ${db}`);
// };
// connectDb();

export interface User {
    email: string;
    password: string;
}

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 255,
    },
});

export const Users = mongoose.model("users", userSchema);

export const createUser = async (
    user: User
): Promise<mongoose.Error | User> => {
    try {
        const result = await Users.create({
            email: user.email,
            password: user.password,
        });
        return result;
    } catch (err: any) {
        console.log("Could not create new doc", err.message);
        return err;
    }
};

export const findUser = async (
    email: string
): Promise<
    | mongoose.Error
    | mongoose.Document<mongoose.Types.ObjectId, any, User>
    | null
> => {
    try {
        const result = await Users.findOne({
            email: email,
        });
        return result;
    } catch (err: any) {
        console.log("could not find user with given email", err);
        return err;
    }
};

export const changePass = async (user: User): Promise<mongoose.Error | boolean> => {
    try {
        const result = await Users.updateOne(
            { email: user.email },
            { password: user.password }
        );
        return result.acknowledged;
    } catch (err: any) {
        console.log("could not update user with given email", err);
        return err;
    }
};
