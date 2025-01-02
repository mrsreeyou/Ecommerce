const Admin = require('../models/AdminModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET || 'secret'; // JWT Secret Key
const path = require('path')
const Product = require('../models/ProductModel')
const Category = require('../models/CategoryModel')
const Subcategory = require('../models/SubcategoryModel')
const User = require('../models/userModel')

//validation

function usernameValidation(username, errors) {
    if (!username) {
        errors.username = "Enter your username"
    }
}

function passwordValidation(password, errors) {
    if (!password) {
        errors.password = "Enter your password."
    } else if (password.length < 6) {
        errors.password = "Password must be at least 6 letters."
    } else if (password.length > 6) {
        errors.password = "Password must only be 6 letters"
    }
}
function nameValidation(name, errors) {
    if (!name) {
        errors.productName = "Enter Product name."
    } else if (/^[A-Z]+$/.test(name)) {
        errors.productName = "Must be include small letters and capital letters.";
    } else if (/^[a-z]+$/.test(name)) {
        errors.productName = "Must be include capital and small letters are allowed.";
    } else if (/[^a-zA-Z]/.test(name)) {
        errors.productName = "Only letters are allowed.";
    } else if (/^[a-z]/.test(name)) {
        errors.productName = "Must be start with a Capital letter.";
    }
}
function descriptionValidation(description, errors) {
    if (!description) {
        errors.description = "Enter description"
    } else if (/[^a-zA-Z]/.test(description)) {
        errors.description = "Only letters are allowed.";
    }
}
function priceValidation(price, errors) {
    if (!price) {
        errors.price = "Enter price"
    } else if (!/^\d+$/.test(price)) {
        errors.age = "Only numbers.";
    }
}

function categoryValidation(name,errors){
    if(!name){
        errors.categoryName="Enter category name"
    }else if (/^[a-z]/.test(name)) {
        errors.categoryName = "Must be start with a Capital letter.";
    }else if (/[^a-zA-Z]/.test(name)) {
        errors.categoryName = "Only letters are allowed.";
    }
}

function subcategoryValidation(name,errors){
    if (!name) {
        errors.categoryName = "Enter Subcategory name.";
    } else if (!/^[A-Z]/.test(name)) {
        errors.categoryName = "Subcategory name must start with a capital letter.";
    } else if (/[^a-zA-Z ]/.test(name)) {
        errors.categoryName = "Subcategory name can only contain letters and spaces.";
    }

}





//login
exports.adminLogin = async (req, res) => {
    const { username, password } = req.body

    //validations(.........
    const errors = {}
    usernameValidation(username, errors)
    passwordValidation(password, errors)
    // If there are validation errors, re-render the form with error messages
    if (Object.keys(errors).length > 0) {
        const logoutTxt = ' '
        return res.render("adminLogin", { logOut: logoutTxt, errors });
    }
    // )..........

    // Check if admin exists
    const admin = await Admin.findOne({ username })
    if (!admin) return res.status(400).send('invalid username or password')

    //verify password
    const hashedpassword = await bcrypt.hash(admin.password, 10)
    const isMatch = await bcrypt.compare(password, hashedpassword)
    if (!isMatch) return res.status(400).send('invalid password or username')

    //generate token
    const token1 = jwt.sign({ id: admin._id }, secret, { expiresIn: '1h' })

    res.cookie('token1', token1)
    res.redirect('/admin/dashboard')
}

//cheak  and verify token
exports.authenticate = (req, res, next) => {
    const token1 = req.cookies.token1;

    if (!token1) {
        return res.redirect('/admin/login');
    }

    try {
        const decoded = jwt.verify(token1, secret);
        req.admin = decoded; // Pass the adminId to the request
        next();
    } catch (err) {
        res.clearCookie('token1');
        return res.redirect('/admin/login');
    }
};

//multer 

const multer = require('multer')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Specify upload directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Set unique file name
    }
});

exports.upload = multer({ storage });



//createproduct
exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, category } = req.body
        const image = `/uploads/${req.file.filename}`

        const errors = {}
        nameValidation(name, errors)
        descriptionValidation(description, errors)
        priceValidation(price, errors)
         // Validate Image
         if (!req.file) {
            errors.image = "Product image is required.";
        }

        // If there are validation errors, re-render the form with error messages
        if (Object.keys(errors).length > 0) {

            const categories = await Category.find()
            return res.render('createProduct', { categories, errors })
        }


        const product = new Product({ name, category, description, price, image })
        await product.save()

        res.redirect('/admin/product/list');

    } catch (err) {
        console.log(`createProduct Error: ${err}`)
        res.send(`creatingProduct Error: ${err}`)
    }

}

//updateProduct

exports.updateProduct = async (req, res) => {

    const { name, description, price, category } = req.body
    const updateData = { name, description, price, category }
    if (req.file) {
        updateData.image = req.file.filename
    }

    await Product.findByIdAndUpdate(req.params.id, updateData)
    res.redirect('/admin/product/list')
}

//deleteProduct

exports.deleteProduct = async (req, res) => {
    const productId = req.params.id    //get product Id from the URL
    await Product.findByIdAndDelete(productId)    //delete product from the mongoDB
    res.redirect('/admin/product/list')
}

//blockProduct

exports.blockProduct = async (req, res) => {
    const productId = req.params.id
    await Product.findByIdAndUpdate(productId, { isBlocked: true, isActive: false }, { new: true })
    res.redirect('/admin/product/list')
}

//unblockProduct

exports.unblockProduct = async (req, res) => {
    const productId = req.params.id;
    await Product.findByIdAndUpdate(productId, { isBlocked: false, isActive: true }, { new: true })
    res.redirect('/admin/product/list')
}

//create category

exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body

        console.log(req.body)
        
        const errors={}
        categoryValidation(name,errors)
        descriptionValidation(description,errors)
        console.log(errors)

        if(Object.keys(errors).length > 0){
            return res.render("createCategory",{errors})
        }

        const category = new Category({ name, description })
        await category.save()
        res.redirect('/admin/category/list')

    } catch (err) {
        console.log(`create category:${err}`);

        res.status(500).send('Error creating category')
    }
}
//category list

exports.categoryList = async (req, res) => {
    const categories = await Category.find()
    res.render('categoryList', { categories })
}
//update category

exports.GetupdateCategory = async (req, res) => {

    const category = await Category.findById(req.params.id)
    res.render('updateCategory', { category })
}

exports.updateCategory = async (req, res) => {

    try {
        const { name, description } = req.body
        const updateData = { name, description }
        await Category.findByIdAndUpdate(req.params.id, updateData)
        res.redirect('/admin/category/list')
    } catch (err) {
        console.log(err);
        res.status(500).send('Error update category')
    }
}
//delete category  
exports.deleteCategory = async (req, res) => {

    try {
        const categoryId = req.params.id
        await Category.findByIdAndDelete(categoryId)
        res.redirect('/admin/category/list')
    } catch (err) {
        console.log(err)
        res.status(500).send('Error delete category')
    }
}

//subcategory list

exports.subcategoryList = async (req, res) => {
    try {
        // Use aggregation to fetch subcategories with category names
        const subcategories = await Subcategory.aggregate([
            {
                $lookup: {
                    from: "categories", // The name of the Category collection
                    localField: "categoryId", // The field in Subcategory that matches the _id in Category
                    foreignField: "_id", // The _id field in Category
                    as: "category" // The resulting array of matched categories
                }
            },
            {
                $unwind: { // Unwind the category array to get a single object
                    path: "$category",
                    preserveNullAndEmptyArrays: true // Include subcategories without a category
                }
            },
            {
                $project: { // Select only the required fields
                    name: 1,
                    description: 1,
                    categoryId: 1,
                    "category.name": 1 // Include only the category name
                }
            }
        ]);

        res.render('subcategoryList', { subcategories });
    } catch (err) {
        console.log(`Error fetching subcategories with aggregation: ${err}`);
    }
}

//create sub category

exports.GetcreateSubcategory = async (req, res) => {
    try {
        const categories = await Category.find()
        res.render('createSubcategory', { categories ,errors:{}})
    } catch (err) {

        console.log(`get create subcategory error: ${err}`);

    }
}

exports.createSubcategory = async (req, res) => {

    try {
        const { name, categoryId, description } = req.body
        const errors = {};

        // Validation for Subcategory Name
    
        subcategoryValidation(name,errors)
        // Validation for Description
       descriptionValidation(name,errors)

        // If there are validation errors, re-render the form with errors
        if (Object.keys(errors).length > 0) {
            const categories = await Category.find();
            return res.render('createSubcategory', { categories, errors });
        }

        
        const subcategory = new Subcategory({ name, categoryId, description })
        await subcategory.save()
        res.redirect('/admin/subcategory/list')
    } catch (err) {
        console.log(`Error creating subcategory:${err} `);
        res.status(500).send('Error creating subcategory')
    }

}

//update sub category

exports.GetupdateSubcategory = async (req, res) => {
    const subcategory = await Subcategory.findById(req.params.id);
    const categories = await Category.find(); // Fetch categories for the dropdown
    res.render('updateSubcategory', { subcategory, categories });
}

//update sub category

exports.updateSubcategory = async (req, res) => {
    const { name, categoryId, description } = req.body;
    await Subcategory.findByIdAndUpdate(req.params.id, req.body)
    res.redirect('/admin/subcategory/list')

}

//delete sub category

exports.deleteSubcategory = async (req, res) => {
    await Subcategory.findByIdAndDelete(req.params.id)
    res.redirect('/admin/subcategory/list')
}

//user list

exports.userList = async (req, res) => {
    try {
        const users = await User.find(); // Fetch all users from the database
        res.render('userList', { users }); // Render userList.ejs and pass the users data

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Internal Server Error');
    }
}
//user Block

exports.userBlock = async (req, res) => {
    try {
        const userId = req.params.id
        await User.findByIdAndUpdate(userId, { isBlocked: true })
        res.redirect('/admin/user/list')

    } catch (err) {
        console.log(`userBlcock Error: ${err}`);
        res.send(`userBlcock Error: ${err}`)
    }

}

//user Unblock

exports.userUnblock = async (req, res) => {
    try {

        const userId = req.params.id
        await User.findByIdAndUpdate(userId, { isBlocked: false })
        res.redirect('/admin/user/list')

    } catch (err) {
        console.log(`userUnblcock Error: ${err}`);
        res.send(`userUnblcock Error: ${err}`)
    }
}