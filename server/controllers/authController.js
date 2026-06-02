import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

export const register = async(req, res) => {
    try{
        const{username, email, password, roleId} = req.body;
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message: "Email already exists"});
        }
        const saltRounds = 10;
        const hashedPwd = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            username, email, password: hashedPwd, role: roleId
        });
        await newUser.save();
        res.status(201).json({
            message: 'User registered successfully',
            user:{
                id:newUser._id, username: newUser.username, roleId: newUser.role
            }
        });
    }
    catch(e){
        console.log(e.message);
        res.status(500).json({error: "Server error"});
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
            return res.status( 401).json({error: "Invalid credentials"});
        }
        //check if password is correct
        const matchPwd = await bcrypt.compare(password, user.password);
        if(!matchPwd){
            return res.status(401).json({
                error: "Invalid credentials"
            });
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
                username: user.username,
                email:user.email,
                roleName: user.role.name,
                permissions:permissionNames
            }
        });
    }
    catch(e){
        console.error(e.message);
        res.status(500).json({error:"Server error"});
    }
};

export const forgotPassword = async (req, res) =>{
    try{
        const user = await User.findOne({
            email: req.body.email
        });
        if(!user){
            return res.status(404).json({
                message:"There is no user with that email."
            });
        }

        const resetToken= crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = Date.now()+10*60*1000;

        await user.save();
        const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
        const message = ` <p> Please click the link below to reset your password. This link is valid for only 10 minutes.</p>
        <a href="${resetUrl}">${resetUrl}</a>`;

        try{
            await sendEmail({
                email:user.email, subject:'Assest managemet - Password reset request', html:message
            });
            res.status(200).json({message: 'Email sent successfully'});
        }
        catch(e){
            user.resetPasswordToken =undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            return res.status(500).json({message:"Failed to send email.Please try again."})
        }
    }
    catch(e){
        res.status(500).json({message:"Server error"})
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
        await user.save();
        res.status(200).json({message: 'Password reset successfully'});
    }
    catch(e){
        res.status(500).json({message:"Server error"})
    }

}