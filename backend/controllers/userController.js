import { sendEmail } from "../middleware/sendMail.js"
import User from "../models/userModel.js"
import { message } from "../utils/message.js"
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
            return Response(res, 400, false, message.idNotFoundMessage)
        }

        // Find user
        let user = await User.findById(id);
        if(!user) {
            return Response(res, 404, false, message.userNotFoundMessage)
        }

        // If user already verified
        if(user.isVerified) {
            return Response(res, 400, false, message.userAlreadyVerifiedMessage)
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

            return Response(res, 400, false, message.otpAttemptsExceededMessage)
        }

        // Check otp
        if(!otp){
            user.otpAttempts += 1;
            await user.save();

            return Response(res, 400, false, message.otpNotFoundMessage)
        }

        // Check if otp is expired
        if(user.otpExpire < Date.now()) {
            user.otp = undefined;
            user.otpAttempts = 0;
            user.otpLockUntil = undefined;
            await user.save();

            return Response(res, 400, false, message.otpExpiredMessage)
        }

        // If otp matches
        if(user.otp !== otp) {
            user.otpAttempts += 1;
            await user.save();

            return Response(res, 400, false, message.otpInvalidMessage)
        }

        // Update user
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpire = undefined;
        user.otpAttempts = 0;
        user.otpLockUntil = undefined;

        await user.save();

        // Authenticate user
        const token = await user.generateToken();

        const options = {
            expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
            httpOnly: true,
            sameSite: 'none',
            secure: true
        }

        res.status(200).cookie('token', token, options).json({
            success: true,
            message: message.userVerifiedMessage,
            data: user
        })


        
    } catch (error) {
        Response(res, 500, false, error.message)
    }
}

export const resendOtp = async (req, res) => {
    try {
        // Fetching id
        const { id } = req.params;

        // Checking id
        if(!id) {
            return Response(res, 400, false, message.idNotFoundMessage)
        }

        // Finding & checking user
        let user = await User.findById(id);
        if(!user) {
            return Response(res, 404, false, message.userNotFoundMessage)
        }

        // Check if user is already verified
        if(user.isVerified) {
            user.otp = undefined;
            user.otpExpire = undefined;
            user.otpAttempts = 0;
            user.otpLockUntil = undefined;
            await user.save();

            return Response(res, 400, false, message.userAlreadyVerifiedMessage)
        }

        // Generate otp
        const otp = Math.floor(100000 + Math.random() * 900000);
        const otpExpire = new Date(Date.now() + process.env.OTP_EXPIRE * 60 * 1000);
        
        // Update user
        user.otp = otp;
        user.otpExpire = otpExpire;
        user.otpAttempts = 0;
        user.otpLockUntil = undefined;
        await user.save();

        // Email generation
        const subject = 'Email verification';
        const body = `Your otp is ${otp}. It will expire in ${process.env.OTP_EXPIRE} minutes`;
        
        await sendEmail({
            email: user.email,
            subject,
            message: body
        })

        // Send response
        Response(res, 200, true, message.otpSentMessage)
        
    } catch (error) {
        Response(res, 500, false, error.message)
    }
}