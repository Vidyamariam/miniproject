const wishlistCollection = require('../model/wishlistModel');
const userCollection = require('../model/userSignupSchema');
const productsCollection = require('../model/productSchema');

exports.getWishlist =  async ( req,res)=> {

    try{
        const session = req.session.user;
        const userdata = await userCollection.findOne(session);
        const userId = userdata._id;
        
        console.log("userId",userId);

         // Retrieve wishlist items for the current user
         const wishlistItems = await wishlistCollection.find({ userId: userId });

         console.log("Wishlist Items:", wishlistItems);
 
         // Pass wishlistItems to the EJS template for rendering
         res.render("user/wishlist", { wishlistItems: wishlistItems });
    }
    catch(error){

        console.log("error in getting wishlist",error);
    }

    
}



exports.addToWishlist = async (req, res) => {
    try {
        const session = req.session.user;
        const userdata = await userCollection.findOne(session);
        const userId = userdata._id;
        const productId = req.params.productId;

        // Find the product from the products collection
        const product = await productsCollection.findById(productId);

        const wishlistItem = new wishlistCollection({
            userId: userId,
            productId: productId,
            productName: product.name,
            productImage: product.productImage,
            price: product.price,
            stock: product.stock,
        });

        // Save the wishlistItem to the database
        await wishlistItem.save();

        // Redirect after the wishlist item is added
        res.redirect("/wishlist");
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        // Handle the error appropriately, e.g., display an error page or redirect
        res.status(500).send("Internal Server Error");
    }
}


exports.removeWishlist = async (req, res) => {
    try {
        const session = req.session.user;
        const userdata = await userCollection.findOne(session);
        const userId = userdata._id;
        console.log("userId", userId);

        const productId = req.params.productId;

        console.log("productId", req.params.productId);

        // Find and delete the product from the wishlist
        await wishlistCollection.findOneAndDelete({ userId: userId, _id: productId });

       
        const updatedWishlistItems = await wishlistCollection.find({ userId: userId });

       
        res.render("user/wishlist", { wishlistItems: updatedWishlistItems });
    } catch (error) {
        console.error("Error removing product from wishlist:", error);
        // Handle the error appropriately, e.g., display an error page or redirect
        res.status(500).send("Internal Server Error");
    }
}

