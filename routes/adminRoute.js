const express = require('express')
const router = express.Router()
const Admin = require('../models/AdminModel')


const { adminLogin, authenticate, createProduct, updateProduct, deleteProduct, blockProduct,
    unblockProduct, createCategory, categoryList, GetupdateCategory,
    updateCategory, deleteCategory, GetcreateSubcategory, createSubcategory,
    subcategoryList, deleteSubcategory, GetupdateSubcategory, updateSubcategory, userList, userBlock, userUnblock,
} = require('../controllers/adminControll')

const multer = require('multer')
const path = require('path')
const Product = require('../models/ProductModel')
const Category = require('../models/CategoryModel')
const { log } = require('console')
const { render } = require('ejs')

const Order = require('../models/OrderModel')




var logoutTxt = ''

//admin login
router.get('/login', (req, res) => {
    res.render('adminLogin', { logOut: logoutTxt, errors: {} })
})
router.post('/login', adminLogin)

//Dashboard

router.get('/dashboard', authenticate, async (req, res) => {
    const adminId = req.admin.id;
    const adminModel = await Admin.find().limit(1)
    console.log(adminModel.username);

    const orders = await Order.find().populate({
        path: 'items.productId',
        populate: { path: 'category' }, // Populate the category
    });

    // Show Category wise Sales 
    const categorySales = {};

    orders.forEach(order => {
        order.items.forEach(item => {
            const category = item.productId.category.name;
            const totalPrice = item.quantity * item.productId.price;

            if (!categorySales[category]) {
                categorySales[category] = 0;
            }

            categorySales[category] += totalPrice;
        });
    });

    //   Show Online and Offline Payment.

    // Initialize sales totals
    let onlineSales = 0;
    let offlineSales = 0;

    // Calculate totals based on payment method
    orders.forEach(order => {
        if (['Credit Card', 'Debit Card', 'UPI'].includes(order.paymentMethod)) {
            onlineSales += order.totalAmount;
        } else if (order.paymentMethod === 'Cash on Delivery') {
            offlineSales += order.totalAmount;
        }
    });

    //   Top Selling 5 Products.

    const productSales = {};

    // Calculate sales for each product
    orders.forEach(order => {
        order.items.forEach(item => {
            const productId = item.productId._id;
            const productName = item.productId.name;
            const productImage = item.productId.image;
            const totalSales = item.quantity;

            if (!productSales[productId]) {
                productSales[productId] = {
                    name: productName,
                    image: productImage,
                    sales: 0
                };
            }

            productSales[productId].sales += totalSales;
        });
    });

    // Sort products by total sales and pick the top 5
    const topProducts = Object.values(productSales)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);


    // Fetch all orders and group them by month
    const monthlyIncome = await Order.aggregate([
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                },
                totalIncome: { $sum: "$totalAmount" },
            },
        },
        {
            $sort: { "_id.year": -1, "_id.month": -1 }, // Sort by most recent month first
        },
    ]);

    res.render('dashboard2', { adminId, adminModel, categorySales, onlineSales, offlineSales, topProducts ,monthlyIncome}); // Render the dashboard with adminId
    // console.log(`token: ${req.admin.iat}`);
});


//logout
router.get('/logout', async (req, res) => {
    res.clearCookie('token1')
    Admin.deleteMany({});

    logoutTxt = 'logout sucessfully'
    res.redirect('/admin/login')
    console.log(`token: ${req.admin}`)
})
//-----------------------------------product--------------------------------------------------

//create Product

router.get('/create/product', authenticate, async (req, res) => {
    const categories = await Category.find()
    res.render('createProduct', { categories, errors: {} })
})

// Ensure the uploads directory exists
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Upload files to the public/uploads folder
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

router.post('/create/product', upload.single('image'), createProduct)

//update product 
router.get('/product/update/:id', authenticate, async (req, res) => {

    const product = await Product.findById(req.params.id)
    const categories = await Category.find()
    res.render('updateProduct', { product, categories, errors: {} });
})

router.post('/product/update/:id', upload.single('image'), updateProduct)

//Delete
router.post('/product/delete/:id', deleteProduct)

//product list
router.get('/product/list', authenticate, async (req, res) => {
    const products = await Product.find().populate('category');
    res.render('productList', { products })
})

//block product

router.post('/product/block/:id', authenticate, blockProduct)

//unblock product

router.post('/product/unblock/:id', authenticate, unblockProduct)

// --------------------------------Category-----------------------------------------------------------------------------

//create category

router.get('/create/category', authenticate, (req, res) => {
    res.render('createCategory', { errors: {} })
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

router.get('/user/list', authenticate, userList);

router.post('/user/block/:id', authenticate, userBlock)

router.post('/user/unblock/:id', authenticate, userUnblock)

router.get('/orders/list', authenticate, async (req, res) => {

    try {
        const { status } = req.query; // Get status from query params

        // Build filter dynamically based on status
        const filter = status ? { status } : {};

        // Fetch orders from the database
        const orders = await Order.find(filter).populate('userId', 'name email'); // Adjust populate fields as needed

        res.render('ordersList', { orders, currentStatus: status || 'All' }); // Pass currentStatus to view



    } catch (error) {
        console.log(`Admin Order List :${error}`)
        res.status(500).send('Admin Order Error')

    }

})

// Update Order Status
router.post('/orders/update/status/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params; // Order ID
        const { status } = req.body; // New status from the form

        // Update the order in the database
        await Order.findByIdAndUpdate(id, { status });

        res.redirect('/admin/orders/list'); // Redirect back to the order list
    } catch (error) {
        console.log(`Order Status Update Error: ${error}`);
        res.status(500).send('Error updating order status');
    }
});

router.get('/ecommerce/data/design', authenticate, (req, res) => {
    res.render('dataDesign')
})

module.exports = router;

