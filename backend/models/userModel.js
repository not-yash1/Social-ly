import mongoose from "mongoose";
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "Please add a first name"],
        minlength: [3, "First name must be at least 3 characters"],
    },
    middleName: {
        type: String,
    },
    lastName: {
        type: String,
        required: [true, "Please add a last name"],
    },
    email: {
        type: String,
        required: [true, "Please add an email"],
        unique: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
        minlength: [8, "Password must be at least 8 characters"],
    },
    dob: {
        type: Date,
        required: [true, "Please add a date of birth"],
        default: Date.now
    },
    mobile: {
        type: Number,
        required: [true, "Please add a mobile number"],
        minlength: [10, "Mobile number must be at least 10 digits"],
        maxlength: [10, "Mobile number must be at least 10 digits"],
        unique: true,
    },
    username: {
        type: String,
        unique: true,
        required: true
    },
    bio: {
        type: String,
        maxlength: [200, "Bio must be at most 200 characters"],
        default: ''
    },
    gender: {
        type: String,
        required: true,
        enum: ['male', 'female', 'other'],
        default: 'male'
    },
    avatar: {
        public_id: {
            type: String,
            default: ''
        },
        url: {
            type: String,
            default: ''
        }
    },
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User_Soc'
        }
    ],
    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User_Soc'
        }
    ],
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post'
        }
    ],
    isAdmin: {
        type: Boolean,
        default: false
    },
    otp: {
        type: Number,
    },
    otpExpire: {
        type: Date,
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpire: {
        type: Date,
    },
    loginAttemp: {
        type: Number,
        default: 0
    },
    loginAttempExpire: {
        type: Date,
    },
    chats: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Chat'
        }
    ],
    updateHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UpdateHistory'
        }
    ]
},{
    timestamps: true
})

userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User_Soc', userSchema) 
export default User

