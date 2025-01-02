const mongoose=require('mongoose')

const AdminSchema= new mongoose.Schema({
    username:String,
    password:String
})

module.exports=new mongoose.model('Admin',AdminSchema)