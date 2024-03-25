

function generateOrderId(req, res, next) {
    // Generate a random orderId
    const orderId = generateRandomId();

    // Add orderId to the request body
    req.body.orderId = orderId;

    // Proceed to the next middleware
    next();
}

function generateRandomId() {
    // You can customize the ID generation logic as per your requirements
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const orderIdLength = 10; // You can adjust the length of the order ID as needed
    let orderId = '';
    for (let i = 0; i < orderIdLength; i++) {
        orderId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return orderId;
}

module.exports = generateOrderId;
