import { sendEmail } from "../middleware/sendMail.js"
import User from "../models/userModel.js"

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