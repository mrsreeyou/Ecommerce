const express=require('express')
const app=express()
const mongoose=require('mongoose')
require('dotenv').config()
const bodyParser = require('body-parser')
const cookieParser=require('cookie-parser')
const Admin=require('../project weeek2/models/AdminModel')
 



//connect to MongoDB

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected');
        return Admin.create({ username: 'mrsreeyou', password: '123456' });
    })
    .then(admin => {
        console.log('Admin user created:', admin);
        return 'http://localhost:3000/user/scart.com'; // Return the desired link
    })
    .then(link => {
        console.log('Link:'+'\x1b[34m%s\x1b[0m', `${link}`);
    })
    .catch(err => {
        console.error('Error:', err);
    })
.catch((err)=>{console.log('MongoDB connection err:',err)})



//middileware
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())

app.set('view engine', 'ejs');

app.use(express.static('public'))
app.use(express.json());

//routes
const adminRoute=require('./routes/adminRoute')
const userRoute=require('./routes/userRoute')

//admin
app.use('/admin',adminRoute)

//user Register and login forget
app.use('/user', userRoute)




app.listen(3000,(console.log('server stratted')))