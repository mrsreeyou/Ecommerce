const mongoose=require('mongoose')

const subcategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    description: { type: String ,required: true},
    createdAt: { type: Date, default: Date.now }
});

module.exports=new mongoose.model('Subcategory',subcategorySchema)