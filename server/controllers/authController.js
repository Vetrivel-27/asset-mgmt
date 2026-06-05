import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

export const register = async(req, res) => {
    try{
        const{userId, username, email, password, roleId} = req.body;
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message: "Email already exists"});
        }
        const saltRounds = 10;
        const hashedPwd = await bcrypt.hash(password, saltRounds);
        const newUser = new User({
            userId: userId || username, email, password: hashedPwd, role: roleId, createdBy: req.user.id
        });
        await newUser.save();
        res.status(201).json({
            message: 'User registered successfully',
            user:{
                id:newUser._id, userId: newUser.userId, roleId: newUser.role
            }
        });
    }
    catch(e){
        console.log(e.message);
        res.status(500).json({message: "Server error"});
    }
};

export const login = async(req, res) => {
    try{
        const{email, password} = req.body;
        //find user
        const user = await User.findOne({email}).populate({
            path:'role',
            populate:{
                path:'permissions', model:'Permission'
            }
        });
        if(!user){
            return res.status( 401).json({message: "Invalid credentials"});
        }
        //check if password is correct
        const matchPwd = await bcrypt.compare(password, user.password);
        if(!matchPwd){
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        if (!user.role) {
            return res.status(401).json({ message: "User account role not configured." });
        }
        const permissionNames = user.role.permissions.map(perm=>perm.name);//permissions array
        //generate jwt
        const token = jwt.sign({
            id: user._id,
            roleId: user.role._id
        }, process.env.JWT_SECRET, { expiresIn: '1h'});

        res.json({
            message: "Login successful",
            token,
            user:{
                id: user._id,
                userId: user.userId,
                email:user.email,
                roleName: user.role.name,
                permissions:permissionNames
            }
        });
    }
    catch(e){
        console.error(e.message);
        res.status(500).json({message:"Server error"});
    }
};

export const forgotPassword = async (req, res) =>{
    try{
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if(!user){
            return res.status(404).json({
                message:"There is no user with that email."
            });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        const otp = crypto.randomInt(100000, 1000000).toString();
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = Date.now()+10*60*1000;
        user.resetPasswordOtp = crypto.createHash('sha256').update(otp).digest('hex');
        user.resetPasswordOtpExpires = Date.now()+10*60*1000;

        await user.save();
        const resetUrl = `http://localhost:3000/forgot-password/${resetToken}`;
        const message = `
        <p>Please use this OTP to verify your password reset request:</p>
        <h2>${otp}</h2>
        <p>Or click the link below to directly create a new password. This link is valid for only 10 minutes.</p>
        <a href="${resetUrl}">${resetUrl}</a>`;

        try{
            await sendEmail({
                email:user.email, subject:'Assest managemet - Password reset request', html:message
            });
            res.status(200).json({message: 'Email sent successfully'});
        }
        catch(e){
            console.error("Failed to send password reset email:", e);
            user.resetPasswordToken =undefined;
            user.resetPasswordExpires = undefined;
            user.resetPasswordOtp = undefined;
            user.resetPasswordOtpExpires = undefined;
            await user.save();
            return res.status(500).json({message:"Failed to send email.Please try again."})
        }
    }
    catch(e){
        res.status(500).json({message:"Server error"})
    }

};

export const verifyResetOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const hashedOtp = crypto.createHash('sha256').update(otp || '').digest('hex');
        const user = await User.findOne({
            email,
            resetPasswordOtp: hashedOtp,
            resetPasswordOtpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "OTP is invalid or has expired" });
        }

        res.status(200).json({ message: "OTP verified successfully" });
    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
};

export const resetPasswordWithOtp = async (req, res) => {
    try {
        const { email, otp, password } = req.body;
        const hashedOtp = crypto.createHash('sha256').update(otp || '').digest('hex');
        const user = await User.findOne({
            email,
            resetPasswordOtp: hashedOtp,
            resetPasswordOtpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "OTP is invalid or has expired" });
        }

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.resetPasswordOtp = undefined;
        user.resetPasswordOtpExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Password reset successfully" });
    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
};

export const resetPassword = async (req,res)=>{
    try{
        const resetPasswordToken = crypto.createHash('sha256') .update(req.params.token).digest('hex');
        const user = await User.findOne({resetPasswordToken, resetPasswordExpires:{$gt: Date.now()}});

        if(!user){
            return res.status(400).json({message:"Token is invalid or has expired"})
        }

        const saltrounds = 10;
        user.password = await bcrypt.hash(req.body.password, saltrounds);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.resetPasswordOtp = undefined;
        user.resetPasswordOtpExpires = undefined;
        await user.save();
        res.status(200).json({message: 'Password reset successfully'});
    }
    catch(e){
        res.status(500).json({message:"Server error"})
    }

}
