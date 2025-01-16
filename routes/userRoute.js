const express = require('express')

const { registerUser, loginUser, forgetPassword, resetPassword } = require('../controllers/userController')
const router = express.Router()
const path = require('path')

const Product = require('../models/ProductModel')
const Category=require('../models/CategoryModel')
const Cart = require('../models/CartModel')
const { render } = require('ejs')


const Order=require('../models/OrderModel')


//register
router.get('/register', (req, res) => {
    res.render('register', { errors: {} })
})
router.post('/register', registerUser)

//login

router.get('/login', (req, res) => {
    res.render('User-Login', { errors: {} })
})
router.post('/login', loginUser)

//log out 

router.get('/logout', (req, res) => {
    res.clearCookie('token')
    res.redirect('/user/scart')
})


//forget
router.get('/forget-password', (req, res) => {
    res.render('forget-password', { errors: {} })
})
router.post('/forget-password', forgetPassword)

//reset
router.get('/reset-password', (req, res) => {
    res.render('reset-password', { errors: {} })
})
router.post('/reset-password', resetPassword)


//-----------------------product page---------------

router.get('/scart', async (req, res) => {
    const products = await Product.find()
    const categories = await Category.find()
    const welcome = ' '
    const token = req.cookies.token;
    // console.log(token);
    
    res.render('scart2', { products, categories, welcome, token })

})

//Product filtter

const{filtter}=require('../controllers/userController')

router.get('/products/filter?', filtter );

//product view details

const{viewDetails}=require('../controllers/userController')

router.get('/views/products/details/:id', viewDetails);

//user authenication

const {ensureAuthenticated }= require('../controllers/userController')

    
// Add to Cart Route

const{addtoCart}=require('../controllers/userController')

router.get('/cart/add/:productId', ensureAuthenticated, addtoCart );

//cart page

const{cartPage}=require('../controllers/userController')

router.get('/cart', ensureAuthenticated, cartPage);

//Remove from Cart

const {removeCart}=require('../controllers/userController')

router.get('/cart/remove/:productId', ensureAuthenticated,removeCart);

//quantity 
const category =require('../models/CategoryModel')
router.get('/quantity/decrease/:id', async (req, res) => {
    try {
        const productId = req.params.id;

        // Find the product by ID
        const product = await Product.findById(productId);

        if (!product) {
            console.log('Product not found');
            return res.status(404).send('Product not found');
        }

        // Check if quantity is greater than zero
        if (product.quantity > 0) {
            // Decrease the quantity
            product.quantity -= 1;

            // Save the updated product
            await product.save();

            // console.log(`Quantity of product ${productId} decreased to:`, product.quantity);
        } else {
            console.log(`Product ${productId} is out of stock`);
        }

        // Redirect to the cart page or send a response
        res.redirect('/user/cart');
    } catch (error) {
        console.error('Error updating product quantity:', error.message);
        res.status(500).send('Internal server error');
    }
});

router.get('/quantity/increase/:id', async (req, res) => {
    try {
        const productId = req.params.id;

        // Find the product by ID
        const product = await Product.findById(productId);

        if (!product) {
            console.log('Product not found');
            return res.status(404).send('Product not found');
        }
            product.quantity += 1;

            await product.save();

            // console.log(`Quantity of product ${productId} increased to:`, product.quantity);
        res.redirect('/user/cart');
    } catch (error) {
        console.error('Error updating product quantity:', error.message);
        res.status(500).send('Internal server error');
    }
});


// Place an Order
const {placeOrder}=require('../controllers/userController')

router.post('/orders/place', ensureAuthenticated, placeOrder);

// View Orders
const {orderPage}=require('../controllers/userController')

router.get('/orders/place', ensureAuthenticated,orderPage);


// Cancel Order

const{cancelOrders}=require('../controllers/userController')

router.post('/orders/cancel/:orderId', ensureAuthenticated,cancelOrders);

// Buy Now Route
const{buyNow}=require('../controllers/userController')

router.post('/bynow/:productId', ensureAuthenticated, buyNow);

// Payment Page Route
const{paymentPage}=require('../controllers/userController')
router.get('/payment/:productId', ensureAuthenticated, paymentPage);

// Place Order Route
const{buyNowPlaceOrder}=require('../controllers/userController')
router.post('/payment/:productId', ensureAuthenticated,buyNowPlaceOrder );

// Add to Wishlist

const {addtoWishlist}=require('../controllers/userController')

router.get('/wishlist/add/:productId', ensureAuthenticated, addtoWishlist);

// Remove from Wishlist
const{removeWishlist}=require('../controllers/userController')

router.get('/wishlist/remove/:productId', ensureAuthenticated,removeWishlist);


// Wishlist Page
const {wishlistPage}=require('../controllers/userController')
const { findById } = require('../models/userModel')

router.get('/wishlist', ensureAuthenticated, wishlistPage);

router.get('/scart.com',(req,res)=>{
    res.render('s')
})

router.get('/payment2',(req,res)=>{
    res.render('payment2')
})
module.exports = router;