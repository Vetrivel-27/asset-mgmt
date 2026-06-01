import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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