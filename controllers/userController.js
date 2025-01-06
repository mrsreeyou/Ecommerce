const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const nodemailer = require('nodemailer')

const Product = require('../models/ProductModel')
const Category=require('../models/CategoryModel')

//register
exports.registerUser = async (req, res) => {
    const { firstname, email, password, age } = req.body;
    //validation
    const errors = {}
    firstnameValidation(firstname, errors)
    ageValidation(age,errors)
    emailValidation(email,errors)
    passwordValidation(password,errors)

    if (Object.keys(errors).length > 0) {
        return res.render('register', { errors });
    }

    const hashedpassword = await bcrypt.hash(password, 10)

    //insert docu to mongodb
    const newUser = new User({
        firstname,
        email,
        password: hashedpassword,
        age
    })
    await newUser.save()
    res.send('Registed successfully, pleace <a href="/user/login">Login</a>');
}

//validations

//First name validation

const firstnameValidation=function(firstname,errors){
     if (!firstname) {
         errors.firstname = "Enter your firstname"
     } else if (!/^[A-Z]/.test(firstname)) {
         errors.firstname = "Must be Name is started with a capital letter."
     } else if (/[^a-zA-Z]/.test(firstname)) {
         errors.firstname = "Only letters are allowed.";
     }
}
//Age validation
const ageValidation=function(age,errors){
 
     if(!age){
        errors.age="Enter your age."
    }else if(age <=18){
        errors.age="Above 18."
    }else if(age > 60){
        errors.age="Only 60 years old."
    } else if (!/^\d+$/.test(age)) {
        errors.age = "Only numbers.";
    }
}

// Validation for email format
const emailValidation= function (email,errors) {

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
        errors.email = "Enter email"
    }
    else if (!email.includes("@")) {
        errors.email = "Email must Include '@'."
    } else if (!email.endsWith("@gmail.com")) {
        errors.email = "Email must end with 'gmail.com'."
    } else if (/[A-Z]/.test(email)) {
        errors.email = "Email must contain only lowercase letters."
    } else if (!emailRegex.test(email)) {
        errors.email = "Invalid email format.";
    }
}

  //validation for password 

const passwordValidation=function(password,errors){

     if (!password) {
        errors.password = "Enter password."
    } else if (password.length < 8) {
        errors.password = "Password must be at least 8 letters."
    } else if (password.length > 8) {
        errors.password = "Password must only be 8 letters"
    } else if (/^[0-9]/.test(password)) {
        errors.password = "Password must be started with letters"
    } else if (/^[a-zA-Z]+$/.test(password)) {
        errors.password = "Must use both letters and numbers.";
    } else if (/^[0-9]+$/.test(password)) {
        errors.password = "Must use both letters and numbers.";
    }
}

const newpasswordValidation=function(newPassword,errors){

    if (!newPassword) {
       errors.newPassword = "Enter your newpassword."
   } else if (newPassword.length < 8) {
       errors.newPassword = "Password must be at least 8 letters."
   } else if (newPassword.length > 8) {
       errors.newPassword = "Password must only be 8 letters"
   } else if (/^[0-9]/.test(newPassword)) {
       errors.newPassword = "Password must be started with letters"
   } else if (/^[a-zA-Z]+$/.test(newPassword)) {
       errors.newPassword = "Must use both letters and numbers.";
   } else if (/^[0-9]+$/.test(newPassword)) {
       errors.newPassword = "Must use both letters and numbers.";
   }
}

//validation for otp

const otpValidation=function(otp,errors){
    if(!otp){
        errors.otp="Enter your otp"
    }else if(otp.length>4){
        errors.otp="invalid otp"
    } else if (!/^\d+$/.test(otp)) {
        errors.age = "Only numbers.";
    }
}

//login
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    //validation
    const errors = {}
    emailValidation(email,errors)
    passwordValidation(password,errors)

    // If there are validation errors, re-render the form with error messages
    if (Object.keys(errors).length > 0) {
        return res.render("User-Login", { errors });
    }

    const user = await User.findOne({ email })

    if (user) {


        const cheackPassword = await bcrypt.compare(password, user.password)
        if (cheackPassword) {

            if (user.isBlocked === false) {

                const products = await Product.find()
                const categories=await Category.find()
                const welcome = `welcome, ${user.firstname} `

                //generate token
                const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '2h' })
                res.cookie('token', token)

                res.render('scart', { products, welcome, token ,categories})

            } else {
                res.send('your email is blocked')
            }

        } else {
            res.send(`In valid password`)
        }


    } else {
        res.send('No user found with that email')
    }
}


//forget
exports.forgetPassword = async (req, res) => {
    const { email } = req.body;

    const errors={}
    emailValidation(email,errors)

     // If there are validation errors, re-render the form with error messages
     if (Object.keys(errors).length > 0) {
        return res.render("forget-password", { errors });
    }

    const user = await User.findOne({ email })

    if (user) {
        let otp = Math.floor(100000 + Math.random() * 900000)
        //inset docu
        user.otp = otp;
        user.otpExpires = Date.now() + 300000; // OTP expires in 5 minutes
        await user.save()
        //save OTP in Cookie
        res.cookie('otp', otp, {
            httpOnly: true,
            maxAge: 300000
        })
        //setup nodemailer to send OTP

        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD
            }
        })

        await transport.sendMail({
            from: process.env.EMAIL,
            to: user.email,
            subject: 'Password Rest OTP',
            text: `Your OTP is ${otp}`
        })
        res.send('OTP send, Please cheak your email and Please <a href="/user/reset-password">Reset-password</a>')
    } else {
        res.send('email not Registed')
    }
}
//reset

exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const storedOtp = req.cookies.otp; // Access OTP from cookie

    const errors={}
    emailValidation(email,errors)
    otpValidation(otp,errors)
    newpasswordValidation(newPassword,errors)

      // If there are validation errors, re-render the form with error messages
      if (Object.keys(errors).length > 0) {
        return res.render("reset-password", { errors });
    }

    if (otp === storedOtp) {
        const user = await User.findOne({ email, otpExpires: { $gt: Date.now() } });

        if (user) {
            user.password = await bcrypt.hash(newPassword, 10);
            user.otp = null;
            user.otpExpires = null;
            await user.save();

            // Clear the OTP cookie after successful reset
            res.clearCookie('otp');

            res.send('Password reset successful. Please <a href="/user/login">login</a>.');
        } else {
            res.send('Invalid or expired OTP.');
        }
    } else {
        res.send('Invalid OTP.');
    }
}

exports.filtter=async (req, res) => {
    const { category, minPrice, maxPrice, status } = req.query;

    let filter = {};
    if (category) filter.category = { $regex: category, $options: 'i' }; // Case-insensitive search
    if (minPrice) filter.price = { ...filter.price, $gte: parseInt(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: parseInt(maxPrice) };
    if (status === 'active') filter.isBlocked = false;
    if (status === 'inactive') filter.isBlocked = true;
    try {
        const products = await Product.find(filter);
        const categories = await Category.find()

        res.render('scart', { products, categories, filters: req.query, welcome: ` `, token: true });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error filtering products');
    }

}

exports.viewDetails=async (req, res) => {
    try {
        const product = await Product.findById(req.params.id); // Get product by ID
        if (!product) {
            return res.status(404).send('Product not found'); // Handle missing product
        }
        res.render('viewDetails', { product, token: true }); // Pass a single product
    } catch (err) {
        console.error(`Error fetching product details: ${err.message}`);
        res.status(500).send('Server error');
    }
}

exports.ensureAuthenticated = (req, res, next) => {

    const token = req.cookies.token
    if (!token) {
        res.redirect('/user/login')
        
    }
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        return next()
    }catch(err){
        res.clearCookie(token)
        return res.redirect('/user/login')
    }
    ; // Redirect to login if not authenticated
};

//Add to Cart 

const Cart = require('../models/CartModel')

exports.addtoCart=async (req, res) => {
    const { productId } = req.params;
    console.log('req.user:', req.user); // Log the authenticated user
    const userId = req.user._id; // Ensure userId is retrieved safely
    console.log(userId)

    if (!userId) {
        return res.status(400).send('User ID is required');
    }

    if (!productId) {
        return res.status(400).send('Product ID is required');
    }

    try {
        // Find or create the user's cart
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [] }); // Assign userId when creating the cart
        }

        // Ensure cart.items is an array
        if (!Array.isArray(cart.items)) {
            cart.items = [];
        }

        // Sanitize existing items
        cart.items = cart.items.filter(item => item.productId);

        // Check if the product already exists in the cart
        const productIndex = cart.items.findIndex(
            item => item.productId && item.productId.toString() === productId
        );

        if (productIndex > -1) {
            // Product exists in the cart, increment quantity
            cart.items[productIndex].quantity += 1;
        } else {
            // Add new product to the cart
            cart.items.push({ productId, quantity: 1 });
        }

        
        await cart.save(); // Save the updated cart
        res.redirect('/user/cart'); // Redirect to the cart page
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding product to cart');
    }
}

//cart page

exports.cartPage=async (req, res) => {
    const userId = req.user?._id; // Ensure userId exists
    if (!userId) {
        return res.status(400).send('User not authenticated');
    }
    try {
        const cart = await Cart.findOne({ userId }).populate('items.productId'); // Populate product details
        res.render('cart', { cart: cart || { items: [] } });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching cart');
    }
}

//Remove from  Cart
exports.removeCart= async (req, res) => {
    const { productId } = req.params;
    const userId = req.user._id; // Ensure userId is safely retrieved

    if (!productId) {
        return res.status(400).send('Product ID is required');
    }

    try {
        // Find the user's cart
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).send('Cart not found');
        }

        // Filter out the product from the cart items
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);



        // Save the updated cart
        await cart.save();

        // Redirect to the cart page after removal
        res.redirect('/user/cart');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error removing product from cart');
    }
}

// Add to Wishilist

const Wishlist = require('../models/WishlistModel')

exports.addtoWishlist=async (req, res) => {
    const { productId } = req.params;
    console.log('req.user:', req.user); // Log the authenticated user
    const userId = req.user._id; // Ensure userId is retrieved safely
    console.log(userId)

    if (!userId) {
        return res.status(400).send('User ID is required');
    }

    if (!productId) {
        return res.status(400).send('Product ID is required');
    }

    try {
        // Find or create the user's cart
        let wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            wishlist = new Wishlist({ userId, items: [] }); // Assign userId when creating the wishlist
        }


        // Ensure cart.items is an array
        if (!Array.isArray(wishlist.items)) {
            wishlist.items = [];
        }

        // Sanitize existing items
        wishlist.items = wishlist.items.filter(item => item.productId);

        // Check if the product already exists in the cart
        const productIndex = wishlist.items.findIndex(
            item => item.productId && item.productId.toString() === productId
        );

        if (productIndex > -1) {
            // Product exists in the cart, increment quantity
            wishlist.items[productIndex].quantity += 1;
        } else {
            // Add new product to the cart
            wishlist.items.push({ productId, quantity: 1 });
        }
        

        await wishlist.save(); // Save the updated cart
        console.log(wishlist.items.name)
        res.redirect('/user/wishlist'); // Redirect to the cart page
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding product to Wishlist');
    }
}

//Remove from Wishlist

exports.removeWishlist= async (req, res) => {
    const { productId } = req.params;
    const userId = req.user._id; // Ensure userId is safely retrieved

    if (!productId) {
        return res.status(400).send('Product ID is required');
    }

    try {
        // Find the user's cart
        let wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            return res.status(404).send('Wishlist not found');
        }

        // Filter out the product from the cart items
        wishlist.items = wishlist.items.filter(item => item.productId.toString() !== productId);

        // Save the updated cart
        await wishlist.save();

        // Redirect to the cart page after removal
        res.redirect('/user/wishlist');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error removing product from cart');
    }
}

//Wishlist page

exports.wishlistPage=async (req, res) => {
    const userId = req.user?._id; // Ensure userId exists
    if (!userId) {
        return res.status(400).send('User not authenticatedkkk');
    }
    try {
        const wishlist = await Wishlist.findOne({ userId }).populate('items.productId'); // Populate product details
        res.render('wishList', { wishlist: wishlist || { items: [] } });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching cart');
    }
}

//Place Order
const Order=require('../models/OrderModel')

exports.placeOrder=async (req, res) => {
    const userId = req.user._id;
    const { paymentMethod } = req.body;
    try {
        // Retrieve the user's cart
        const cart = await Cart.findOne({ userId }).populate('items.productId');

        if (!cart || cart.items.length === 0) {
            return res.status(400).send('Your cart is empty.');
        }

        // Calculate the total amount
        const totalAmount = cart.items.reduce((total, item) => {
            return total + item.productId.price * item.quantity;
        }, 0);

        // Create the order
        const newOrder = new Order({
            userId,
            items: cart.items.map(item => ({
                productId: item.productId._id,
                quantity: item.quantity,
            })),
            totalAmount,
            paymentMethod,
        });

        await newOrder.save();

        // Clear the cart after placing the order
        // cart.items = [];
        await cart.save();

        res.redirect('/user/orders/place'); // Redirect to orders page
    } catch (err) {
        console.error(err);
        res.status(500).send('Error placing the order');
    }
}

//Order page 

exports.orderPage=async (req, res) => {
    const userId = req.user._id;

    try {
        const orders = await Order.find({ userId }).populate('items.productId');

        res.render('orders', { orders });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching orders');
    }
}

// Cancel Orders

exports.cancelOrders=async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user._id;

    try {
        const order = await Order.findOne({ _id: orderId, userId });

        if (!order || order.status !== 'Pending') {
            return res.status(400).send('Order cannot be cancelled.');
        }

        order.status = 'Cancelled';
        await order.save();

        res.redirect('/user/orders/place');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error cancelling the order');
    }
}

exports.buyNow=async (req, res) => {
    const { productId } = req.params;
    const userId = req.user._id;

    try {
        // Find or create the user's cart
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // Ensure the cart is properly initialized
        if (!Array.isArray(cart.items)) {
            cart.items = [];
        }

        // Add or update the product in the cart
        const productIndex = cart.items.findIndex(
            item => item.productId && item.productId.toString() === productId
        );

        if (productIndex > -1) {
            cart.items[productIndex].quantity = 1; // Set quantity to 1 for Buy Now
        } else {
            cart.items = [{ productId, quantity: 1 }];
        }

        await cart.save(); // Save the cart

        // Redirect to the payment page
        res.redirect(`/user/payment/${productId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing Buy Now');
    }
} 

exports.paymentPage=async (req, res) => {
    if (!req.user) {
        return res.status(400).send('User not authenticated');
    }

    const { productId } = req.params;
    const userId = req.user._id;

    try {
        // Find the user's cart and populate the productId field in the items
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart) {
            return res.status(400).send('Cart not found');
        }

        const item = cart.items.find(item => item.productId && item.productId._id.toString() === productId);
        if (!item) {
            return res.status(400).send('Product not found in cart');
        }

        const totalAmount = item.productId.price * item.quantity;

        res.render('payment', { order: { _id: productId, totalAmount } });
    } catch (err) {
        console.error(`Error fetching payment details: ${err}`);
        res.status(500).send('Error fetching payment details');
    }
}

//Buynow Place Order

exports.buyNowPlaceOrder=async (req, res) => {
    const userId = req.user._id;
    const { productId } = req.params;
    const { paymentMethod } = req.body;

    try {
        // Retrieve the user's cart and populate the items.productId
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart) {
            return res.status(400).send('Cart not found');
        }

        // Find the item in the cart with the matching productId
        const item = cart.items.find(item => item.productId && item.productId._id.toString() === productId);
        
        if (!item) {
            console.error('Product not found in cart:', productId);
            return res.status(400).send('Product not found in cart');
        }

        // Calculate the total amount
        const totalAmount = item.productId.price * item.quantity;

        // Create the order
        const newOrder = new Order({
            userId,
            items: [{ productId: item.productId._id, quantity: item.quantity }],
            totalAmount,
            paymentMethod,
        });

        await newOrder.save();

        // Clear the cart after placing the order
        cart.items = [];
        await cart.save();

        res.redirect('/user/orders/place'); // Redirect to orders page
    } catch (err) {
        console.error('Error placing the order:', err);
        res.status(500).send('Error placing the order');
    }
}