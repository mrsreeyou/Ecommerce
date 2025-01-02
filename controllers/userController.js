const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const nodemailer = require('nodemailer')

const Product = require('../models/ProductModel')
const Category=require('../models/CategoryModel')

//register
exports.registerUser = async (req, res) => {
    const { firstname, email, password, age } = req.body;
    //validation
    const errors = {}
    firstnameValidation(firstname, errors)
    ageValidation(age,errors)
    emailValidation(email,errors)
    passwordValidation(password,errors)

    if (Object.keys(errors).length > 0) {
        return res.render('register', { errors });
    }

    const hashedpassword = await bcrypt.hash(password, 10)

    //insert docu to mongodb
    const newUser = new User({
        firstname,
        email,
        password: hashedpassword,
        age
    })
    await newUser.save()
    res.send('Registed successfully, pleace <a href="/user/login">Login</a>');
}

//validations

//First name validation

const firstnameValidation=function(firstname,errors){
     if (!firstname) {
         errors.firstname = "Enter your firstname"
     } else if (!/^[A-Z]/.test(firstname)) {
         errors.firstname = "Must be Name is started with a capital letter."
     } else if (/[^a-zA-Z]/.test(firstname)) {
         errors.firstname = "Only letters are allowed.";
     }
}
//Age validation
const ageValidation=function(age,errors){
 
     if(!age){
        errors.age="Enter your age."
    }else if(age <=18){
        errors.age="Above 18."
    }else if(age > 60){
        errors.age="Only 60 years old."
    } else if (!/^\d+$/.test(age)) {
        errors.age = "Only numbers.";
    }
}

// Validation for email format
const emailValidation= function (email,errors) {

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
        errors.email = "Enter email"
    }
    else if (!email.includes("@")) {
        errors.email = "Email must Include '@'."
    } else if (!email.endsWith("@gmail.com")) {
        errors.email = "Email must end with 'gmail.com'."
    } else if (/[A-Z]/.test(email)) {
        errors.email = "Email must contain only lowercase letters."
    } else if (!emailRegex.test(email)) {
        errors.email = "Invalid email format.";
    }
}

  //validation for password 

const passwordValidation=function(password,errors){

     if (!password) {
        errors.password = "Enter password."
    } else if (password.length < 8) {
        errors.password = "Password must be at least 8 letters."
    } else if (password.length > 8) {
        errors.password = "Password must only be 8 letters"
    } else if (/^[0-9]/.test(password)) {
        errors.password = "Password must be started with letters"
    } else if (/^[a-zA-Z]+$/.test(password)) {
        errors.password = "Must use both letters and numbers.";
    } else if (/^[0-9]+$/.test(password)) {
        errors.password = "Must use both letters and numbers.";
    }
}

const newpasswordValidation=function(newPassword,errors){

    if (!newPassword) {
       errors.newPassword = "Enter your newpassword."
   } else if (newPassword.length < 8) {
       errors.newPassword = "Password must be at least 8 letters."
   } else if (newPassword.length > 8) {
       errors.newPassword = "Password must only be 8 letters"
   } else if (/^[0-9]/.test(newPassword)) {
       errors.newPassword = "Password must be started with letters"
   } else if (/^[a-zA-Z]+$/.test(newPassword)) {
       errors.newPassword = "Must use both letters and numbers.";
   } else if (/^[0-9]+$/.test(newPassword)) {
       errors.newPassword = "Must use both letters and numbers.";
   }
}

//validation for otp

const otpValidation=function(otp,errors){
    if(!otp){
        errors.otp="Enter your otp"
    }else if(otp.length>4){
        errors.otp="invalid otp"
    } else if (!/^\d+$/.test(otp)) {
        errors.age = "Only numbers.";
    }
}

//login
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    //validation
    const errors = {}
    emailValidation(email,errors)
    passwordValidation(password,errors)

    // If there are validation errors, re-render the form with error messages
    if (Object.keys(errors).length > 0) {
        return res.render("User-Login", { errors });
    }

    const user = await User.findOne({ email })

    if (user) {


        const cheackPassword = await bcrypt.compare(password, user.password)
        if (cheackPassword) {

            if (user.isBlocked === false) {

                const products = await Product.find()
                const categories=await Category.find()
                const welcome = `welcome, ${user.firstname} `

                //generate token
                const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '2h' })
                res.cookie('token', token)

                res.render('scart', { products, welcome, token ,categories})

            } else {
                res.send('your email is blocked')
            }

        } else {
            res.send(`In valid password`)
        }


    } else {
        res.send('No user found with that email')
    }
}


//forget
exports.forgetPassword = async (req, res) => {
    const { email } = req.body;

    const errors={}
    emailValidation(email,errors)

     // If there are validation errors, re-render the form with error messages
     if (Object.keys(errors).length > 0) {
        return res.render("forget-password", { errors });
    }

    const user = await User.findOne({ email })

    if (user) {
        let otp = Math.floor(100000 + Math.random() * 900000)
        //inset docu
        user.otp = otp;
        user.otpExpires = Date.now() + 300000; // OTP expires in 5 minutes
        await user.save()
        //save OTP in Cookie
        res.cookie('otp', otp, {
            httpOnly: true,
            maxAge: 300000
        })
        //setup nodemailer to send OTP

        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD
            }
        })

        await transport.sendMail({
            from: process.env.EMAIL,
            to: user.email,
            subject: 'Password Rest OTP',
            text: `Your OTP is ${otp}`
        })
        res.send('OTP send, Please cheak your email and Please <a href="/user/reset-password">Reset-password</a>')
    } else {
        res.send('email not Registed')
    }
}
//reset

exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const storedOtp = req.cookies.otp; // Access OTP from cookie

    const errors={}
    emailValidation(email,errors)
    otpValidation(otp,errors)
    newpasswordValidation(newPassword,errors)

      // If there are validation errors, re-render the form with error messages
      if (Object.keys(errors).length > 0) {
        return res.render("reset-password", { errors });
    }

    if (otp === storedOtp) {
        const user = await User.findOne({ email, otpExpires: { $gt: Date.now() } });

        if (user) {
            user.password = await bcrypt.hash(newPassword, 10);
            user.otp = null;
            user.otpExpires = null;
            await user.save();

            // Clear the OTP cookie after successful reset
            res.clearCookie('otp');

            res.send('Password reset successful. Please <a href="/user/login">login</a>.');
        } else {
            res.send('Invalid or expired OTP.');
        }
    } else {
        res.send('Invalid OTP.');
    }
}