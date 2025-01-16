const { name } = require('ejs')
const mongoose=require('mongoose')
const ProductSchema= new mongoose.Schema({
    name: {type: String, required:true},
    category:{type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Category'},
    description: {type: String, required:true},
    price: {type: Number, required:true},
    image: {type: String, required:true},
    isBlocked: {type: Boolean, default: false}, // Field to track blocked status
    isActive:{type: Boolean, default: true},
    quantity: { type: Number, default: 1 }
})

module.exports=mongoose.model('Product',ProductSchema)