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
    const token = false
    res.render('scart', { products, categories, welcome, token })

})

//Product filtter

const{filtter}=require('../controllers/userController')

router.get('/products/filter', filtter );

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


// Add to Wishlist

const {addtoWishlist}=require('../controllers/userController')

router.get('/wishlist/add/:productId', ensureAuthenticated, addtoWishlist);

// Remove from Wishlist
const{removeWishlist}=require('../controllers/userController')

router.get('/wishlist/remove/:productId', ensureAuthenticated,removeWishlist);


// Wishlist Page
const {wishlistPage}=require('../controllers/userController')

router.get('/wishlist', ensureAuthenticated, wishlistPage);



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

router.get('/scart.com',(req,res)=>{
    res.render('s')
})
module.exports = router;