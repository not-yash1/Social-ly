
export const message = {
    idNotFoundMessage: "Please provide valid id",
    userNotFoundMessage: "User not found",
    userAlreadyVerifiedMessage: "User already verified",
    otpAttemptsExceededMessage: `Too many attempts. Try again in ${process.env.OTP_LOCK_TIME} minutes`,
    otpNotFoundMessage: "Please provide valid otp",
    otpExpiredMessage: "Otp expired. Generate new otp",
    otpInvalidMessage: "Invalid otp",
    userVerifiedMessage: "User verified successfully",
    otpSentMessage: "Otp sent to your mail successfully",
    badAuthMessage: "Invalid email or password",
    otpAttemptsExceededMessage: "Too many attempts. Try again later",
    missingFieldMessage: "Please provide all required fields",
}