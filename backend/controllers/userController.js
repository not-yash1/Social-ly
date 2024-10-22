import { sendEmail } from "../middleware/sendMail.js"
import User from "../models/userModel.js"
import { idNotFoundMessage, otpAttemptsExceededMessage, userAlreadyVerifiedMessage, userNotFoundMessage } from "../utils/message.js"
import { Response } from "../utils/response.js"

export const registerUser = async (req, res) => {
    try {
        // Parsing body data
        const { firstName, middleName, lastName, mobile, dob, username, gender, email, password, bio } = req.body

        // Checking body data
        if(!firstName || !lastName || !mobile || !email || !password || !dob || !username || !gender) {
            res.status(400).json({
                success: false,
                message: "Provide all required fields"
            })
        }

        // Check if user exists
        let user = await User.findOne({ email })
        if(user) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            })
        }

        user = await User.findOne({ mobile })
        if(user) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            })
        }

        user = await User.findOne({ username })
        if(user) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            })
        }

        // Create user
        user = await User.create({...req.body});

        // OTP generation
        const otp = Math.floor(100000 + Math.random() * 900000);
        if(otp === 1000000) {
            otp = 999999
        }
        const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

        user.otp = otp;
        user.otpExpire = otpExpire;
        await user.save();

        // Email generation
        const subject = "Email verification";
        const message = `Your OTP is ${otp}`;
        await sendEmail({
            email,
            subject,
            message
        })

        // Send response
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user
        })
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const verifyUser = async (req, res) => {
    try {
        // Fetching id and otp
        const { id } = req.params;
        const { otp } = req.body;

        // Checking id and otp
        if(!id) {
            return Response(res, 400, false, idNotFoundMessage)
        }

        // Find user
        let user = await User.findById(id);
        if(!user) {
            return Response(res, 404, false, userNotFoundMessage)
        }

        // If user already verified
        if(user.isVerified) {
            return Response(res, 400, false, userAlreadyVerifiedMessage)
        }

        // If otpAttempt is not locked
        if(user.otpLockUntil > Date.now()) {
            user.otp = undefined;
            user.otpExpire = undefined;
            user.otpAttempts = 0;
            await user.save();

            return Response(res, 400, false, `Try again after ${Math.floor((user.otpLockUntil - Date.now()) % (60*1000))} minutes and ${Math.floor((user.otpLockUntil - Date.now()) % (1000))} seconds`)
        }

        // Check otpAttempts
        if(user.otpAttempts >= 3) {
            user.otp = undefined;
            user.otpExpire = undefined;
            user.otpAttempts = 0;
            user.otpLockUntil = Date.now() + process.env.OTP_LOCK_TIME * 60 * 1000;
            await user.save();

            return Response(res, 400, false, otpAttemptsExceededMessage)
        }


        
    } catch (error) {
        Response(res, 500, false, error.message)
    }
}