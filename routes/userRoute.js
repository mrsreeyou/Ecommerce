const express = require('express')

const { registerUser, loginUser, forgetPassword, resetPassword } = require('../controllers/userController')
const router = express.Router()
const path = require('path')

const Product = require('../models/ProductModel')
const Category = require('../models/CategoryModel')
const Cart = require('../models/CartModel')
const { render } = require('ejs')
const jwt = require('jsonwebtoken')
const Wishlist = require('../models/WishlistModel')
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

router.get('/products/filter', async (req, res) => {
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

});

router.get('/views/products/details/:id', async (req, res) => {
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
});


// router.get('/mycart/:id',async(req,res)=>{
//     try{
//         const product=await Product.findById(req.params.id)
//         res.render('cart',{product})
//     }catch(err){
//         console.log(`add to cart error: ${err}`);

//     }

// })

const ensureAuthenticated = (req, res, next) => {

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

// Add to Cart Route
router.get('/cart/add/:productId', ensureAuthenticated, async (req, res) => {
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
});


router.get('/cart', ensureAuthenticated, async (req, res) => {
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
});

//Remove from Cart

router.get('/cart/remove/:productId', ensureAuthenticated, async (req, res) => {
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
});

//wish list

// Add to Wishlist
router.get('/wishlist/add/:productId', ensureAuthenticated, async (req, res) => {
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
});

// Remove from Wishlist
router.get('/wishlist/remove/:productId', ensureAuthenticated, async (req, res) => {
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
});


// Wishlist Page

router.get('/wishlist', ensureAuthenticated, async (req, res) => {
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
});

//place order

// Place an Order
router.post('/orders/place', ensureAuthenticated,async (req, res) => {
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
});

// View Orders
router.get('/orders/place', ensureAuthenticated,async (req, res) => {
    const userId = req.user._id;

    try {
        const orders = await Order.find({ userId }).populate('items.productId');

        res.render('orders', { orders });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching orders');
    }
});

//cancel order

// Cancel Order
router.post('/orders/cancel/:orderId', ensureAuthenticated,async (req, res) => {
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
});

// Buy Now Route
router.post('/bynow/:productId', ensureAuthenticated, async (req, res) => {
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
});
// Payment Page Route
router.get('/payment/:productId', ensureAuthenticated, async (req, res) => {
    const { productId } = req.params;
    const userId = req.user._id;

    try {
        // Find the user's cart
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart) {
            return res.status(400).send('Cart not found');
        }

        const item = cart.items.find(item => item.productId._id.toString() === productId);
        if (!item) {
            return res.status(400).send('Product not found in cart');
        }

        const totalAmount = item.productId.price * item.quantity;

        res.render('payment', { order: { _id: productId, totalAmount } });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching payment details');
    }
});
// Place Order Route
router.post('/payment/:productId', ensureAuthenticated, async (req, res) => {
    const userId = req.user._id;
    const { productId } = req.params;
    const { paymentMethod } = req.body;

    try {
        // Retrieve the user's cart
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart) {
            return res.status(400).send('Cart not found');
        }

        const item = cart.items.find(item => item.productId._id.toString() === productId);
        if (!item) {
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

        // Clear the cart
        cart.items = [];
        await cart.save();

        res.redirect('/user/orders/place'); // Redirect to orders page
    } catch (err) {
        console.error(err);
        res.status(500).send('Error placing the order');
    }
});

router.get('/scart.com',(req,res)=>{
    res.render('s')
})
module.exports = router;