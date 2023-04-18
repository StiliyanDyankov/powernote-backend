import nodemailer from "nodemailer";
import config from 'config';

// failed attempt to use gmail as a service
let transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
        user: config.get("email-username"),
        pass: config.get("email-password"),
    },
});

export const sendEmail = async (to: string, code: string) => {
    let info = await transporter.sendMail(
        {
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
        },
        (err, info) => {
            if (err) {
                return console.log(err);
            }
            console.log("Message sent: %s", info.messageId);
        }
    );
    console.log(info);
};

// sendEmail("stiliandiankov0704@gmail.com", "12345");
