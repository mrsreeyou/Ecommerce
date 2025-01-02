const { name } = require('ejs')
const mongoose=require('mongoose')
const ProductSchema= new mongoose.Schema({
    name: {type: String, required:true},
    category:{type: String, required: true},
    description: {type: String, required:true},
    price: {type: Number, required:true},
    image: {type: String, required:true},
    isBlocked: {type: Boolean, default: false}, // Field to track blocked status
    isActive:{type: Boolean, default: true}
})

module.exports=mongoose.model('Product',ProductSchema)