const API_URL = "http://127.0.0.1:8000/api";

// Fetch and display products
async function fetchProducts() {
    let response = await fetch(`${API_URL}/products`);
    let products = await response.json();
    let productContainer = document.getElementById("products");
    productContainer.innerHTML = "";

    products.forEach(product => {
        let productDiv = document.createElement("div");
        productDiv.innerHTML = `
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p>Price: $${product.price}</p>
            <button onclick="addToCart(${product.id})">Add to Cart</button>
        `;
        productContainer.appendChild(productDiv);
    });
}

// Add product to cart
async function addToCart(productId) {
    let response = await fetch(`${API_URL}/cart`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ product_id: productId, quantity: 1 })
    });

    let result = await response.json();
    alert(result.message);
    fetchCart();
}

// Fetch and display cart
async function fetchCart() {
    let response = await fetch(`${API_URL}/cart`);
    let cart = await response.json();
    let cartContainer = document.getElementById("cart");
    cartContainer.innerHTML = "";

    for (let itemId in cart) {
        let item = cart[itemId];
        let cartItemDiv = document.createElement("div");
        cartItemDiv.innerHTML = `
            <p>${item.name} (x${item.quantity}) - $${item.price * item.quantity}</p>
            <button onclick="removeFromCart(${item.id})">Remove</button>
        `;
        cartContainer.appendChild(cartItemDiv);
    }
}

// Remove product from cart
async function removeFromCart(productId) {
    let response = await fetch(`${API_URL}/cart/${productId}`, {
        method: "DELETE"
    });

    let result = await response.json();
    alert(result.message);
    fetchCart();
}

// Load products and cart on page load
window.onload = function () {
    fetchProducts();
    fetchCart();
};
