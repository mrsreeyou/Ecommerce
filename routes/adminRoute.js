const express = require('express')
const router = express.Router()
const Admin = require('../models/AdminModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET || 'secret'; // JWT Secret Key

const { adminLogin, authenticate, createProduct, updateProduct, deleteProduct, blockProduct,
    unblockProduct, createCategory, categoryList, GetupdateCategory,
    updateCategory, deleteCategory, GetcreateSubcategory, createSubcategory,
    subcategoryList, deleteSubcategory, GetupdateSubcategory, updateSubcategory,userList,userBlock,userUnblock,
} = require('../controllers/adminControll')

const multer = require('multer')
const path = require('path')
const Product = require('../models/ProductModel')
const Category = require('../models/CategoryModel')
const Subcategory = require('../models/SubcategoryModel')
const User = require('../models/userModel')
const { log } = require('console')
const { render } = require('ejs')

const Order=require('../models/OrderModel')




var logoutTxt = ''

//admin login
router.get('/login', (req, res) => {
    res.render('adminLogin', { logOut: logoutTxt ,errors:{} })
})
router.post('/login', adminLogin)

//Dashboard

router.get('/dashboard', authenticate, async (req, res) => {
    const adminId = req.admin.id; // Retrieve adminId from the request

    res.render('dashboard', { adminId }); // Render the dashboard with adminId
    console.log(`token: ${req.admin.iat}`);
});


//logout
router.get('/logout', async (req, res) => {
    res.clearCookie('token1')

    logoutTxt = 'logout sucessfully'
    res.redirect('/admin/login')
    console.log(`token: ${req.admin}`)
})
//-----------------------------------product--------------------------------------------------

//create Product

router.get('/create/product', authenticate, async (req, res) => {
    const categories = await Category.find()
    res.render('createProduct', { categories, errors:{} })
})

// Ensure the uploads directory exists
const fs = require('fs');
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer to store files in public/uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Upload files to the public/uploads folder
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

router.post('/create/product', upload.single('image'), createProduct)

//update product 
router.get('/product/update/:id', authenticate, async (req, res) => {

    const product = await Product.findById(req.params.id)
    const categories = await Category.find()
    res.render('updateProduct', { product, categories ,errors:{} });
})

router.post('/product/update/:id', upload.single('image'), updateProduct)

//Delete
router.post('/product/delete/:id', deleteProduct)

//product list
router.get('/product/list', authenticate, async (req, res) => {
    const products = await Product.find();
    res.render('productList', { products })
})

//block product

router.post('/product/block/:id', authenticate, blockProduct)

//unblock product

router.post('/product/unblock/:id', authenticate, unblockProduct)

// --------------------------------Category-----------------------------------------------------------------------------

//create category

router.get('/create/category', authenticate, (req, res) => {
    res.render('createCategory',{errors:{}})
})

router.post('/create/category/', authenticate, createCategory)

//category list

router.get('/category/list', authenticate, categoryList)

//update category

router.get('/category/update/:id', authenticate, GetupdateCategory)

router.post('/category/update/:id', authenticate, updateCategory)

//delete category

router.post('/category/delete/:id', authenticate, deleteCategory)


//------------------------------subcategory------------------------

router.get('/create/subcategory', authenticate, GetcreateSubcategory)

//create sub category

router.post('/create/subcategory', authenticate, createSubcategory)

//sub-category list

router.get('/subcategory/list', authenticate, subcategoryList);

// update sub-category

router.get('/subcategory/update/:id', authenticate, GetupdateSubcategory);

router.post('/subcategory/update/:id', authenticate, updateSubcategory)

//delete sub-category

router.post('/subcategory/delete/:id', authenticate, deleteSubcategory)

//-------------------------------userlist-----------------------------------------

router.get('/user/list', authenticate, userList );

router.post('/user/block/:id',authenticate, userBlock)

router.post('/user/unblock/:id',authenticate, userUnblock)

router.get('/orders/list',authenticate,async(req,res)=>{

    try { 
        
    const orders= await Order.find()
    res.render('ordersList',{orders})

    }catch(error){
        console.log(`Admin Order List :${error}`)
        res.status(500).send('Admin Order Error')
        
    }
    
})

module.exports = router;

