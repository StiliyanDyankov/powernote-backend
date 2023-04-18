"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("config"));
// failed attempt to use gmail as a service
let transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: config_1.default.get("email-username"),
        pass: config_1.default.get("email-password"),
    },
});
const sendEmail = (to, code) => __awaiter(void 0, void 0, void 0, function* () {
    let info = yield transporter.sendMail({
        from: "stilko",
        to: to,
        subject: "NoReply: Verification Code",
        html: `
            <div style="background-color: #f5f5f5; padding: 20px; font-family: sans-serif; font-size: 16px; color: #333333;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #90caf9; padding: 20px; border-radius: 5px;">
                    <div style="text-align: center;">
                        <div style="display: inline-block; background-color: #f5f5f5; padding: 10px 20px; border-radius: 5px;">
                        <h1 style="font-size: 48px; margin-bottom: 0; margin-top: 0; color: #003554">KN</h1>
                    </div>
                    
                </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <h1 style="font-size: 24px; margin-bottom: 0;">Verification Code</h1>
                        <p style="font-size: 18px; margin-top: 0;">Please enter the following code to verify your account.</p>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
            
                        <div style="display: inline-block; background-color: #003554; padding: 10px 20px; border-radius: 5px;">
                            <h1 style="font-size: 24px; margin-bottom: 0; margin-top: 0; color: #ffffff ">${code}</h1>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <p style="font-size: 18px; margin-top: 0;">If you did not request this, please ignore this email.</p>
                    </div>
                </div>
            </div>`,
    }, (err, info) => {
        if (err) {
            return console.log(err);
        }
        console.log("Message sent: %s", info.messageId);
    });
    console.log(info);
});
exports.sendEmail = sendEmail;
// sendEmail("stiliandiankov0704@gmail.com", "12345");
