$(document).ready(function () {
  loadComponents();
  setupFormHandlers();
  if ($("#products-list").length > 0) {
    loadProducts();
  }
  if ($("#cart-items").length > 0) {
    loadCart();
  }
  fetchProducts();
  checkUserSession();
  addProduct();

  
   


});

// Load Header & Footer
function loadComponents() {
  $("#add-product-link").hide();
  $("#show-product-link").hide();
  $("#logout-btn").hide();

  $("#header").load("components/header.html");
  $("#footer").load("components/footer.html");
}

function checkUserSession() {
  let token = localStorage.getItem("token");
  if (token) {
    $.ajax({
      url: "http://127.0.0.1:8000/api/user",
      method: "GET",
      headers: { Authorization: "Bearer " + token },
      success: function (response) {
        let user = response.user;
        $("#login-link, #register-link").hide();
        $("#logout-btn").show();
        $("#show_cart").show();

        if (user.role == 2) {
          $("#add-product-link").show();
          $("#show-product-link").show();
        } else {
          $("#add-product-link").hide();
          $("#show-product-link").hide();
        }
      },
      error: function () {
        console.log("Failed to fetch user data.");
      },
    });
  } else {
    $("#login-link, #register-link").show();
    $("#logout-btn, #add-product-link").hide();
  }
}

// Handle Form Submissions
function setupFormHandlers() {
  $("#login-form").submit(function (e) {
    e.preventDefault();
    loginUser();
  });

  $("#register-form").submit(function (e) {
    e.preventDefault();
    registerUser();
  });
}

// Login User
function loginUser() {
  let email = $("#login-email").val();
  let password = $("#login-password").val();

  $.ajax({
    url: "http://127.0.0.1:8000/api/login",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({ email, password }),
    success: function (response) {
      localStorage.setItem("token", response.token);
      showToast("success", "Login successful!");
      setTimeout(() => (window.location.href = "products.html"), 1000);
    },
    error: function (xhr) {
      let errorMsg = xhr.responseJSON
        ? xhr.responseJSON.message
        : "Login failed!";
      showToast("error", errorMsg);
    },
  });
}

// Register User
function registerUser() {
  let name = $("#register-name").val();
  let email = $("#register-email").val();
  let password = $("#register-password").val();
  let role = $("#register-role").val();

  $.ajax({
    url: "http://127.0.0.1:8000/api/register",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({ name, email, password, role }),
    success: function (response) {
      showToast("success", "Registration successful! Please login.");
      setTimeout(() => (window.location.href = "login.html"), 1000);
    },
    error: function (xhr) {
      let errorMsg = xhr.responseJSON
        ? xhr.responseJSON.message
        : "Registration failed!";
      showToast("error", errorMsg);
    },
  });
}

function addProduct() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  if (productId) {
    $("#form-title").text("Edit Product");
    $("#submit-button").text("Update Product");

    // Fetch existing product details
    $.ajax({
      url: `http://127.0.0.1:8000/api/products/${productId}`,
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      type: "GET",
      success: function (data) {
        $("#product-id").val(data.id);
        $("#name").val(data.name);
        $("#price").val(Number(data.price).toFixed(2));
        $("#description").val(data.description);
        $("#stock_quantity").val(data.stock_quantity);
        $("#status").val(data.status);
      },
      error: function () {
        toastr.error("Failed to load product details.");
      },
    });
  }
  $("#product-form").submit(function (event) {
    event.preventDefault();

    let productData = {
      name: $("#name").val(),
      price: $("#price").val(),
      description: $("#description").val(),
      stock_quantity: $("#stock_quantity").val(),
      status: $("#status").val(),
    };

    if (productId) {
      $.ajax({
        url: `http://127.0.0.1:8000/api/products/${productId}`,
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        type: "PUT",
        data: productData,
        success: function () {
          toastr.success("Product updated successfully!");
          setTimeout(() => (window.location.href = "product-list.html"), 1500);
        },
        error: function () {
          toastr.error("Failed to update product.");
        },
      });
    } else {
      $.ajax({
        url: "http://127.0.0.1:8000/api/products",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        type: "POST",
        data: productData,
        success: function () {
          toastr.success("Product added successfully!");
          $("#product-form")[0].reset();
          setTimeout(() => (window.location.href = "product-list.html"), 1500);
        },
        error: function () {
          toastr.error("Failed to add product.");
        },
      });
    }
  });
}

// Logout User
function logout() {
  let token = localStorage.getItem("token");

  if (!token) {
    showToast("error", "You are not logged in!");
    return;
  }

  $.ajax({
    url: "http://127.0.0.1:8000/api/logout",
    method: "POST",
    headers: { Authorization: "Bearer " + token },
    success: function () {
      localStorage.removeItem("token");
      showToast("success", "Logged out successfully!");
      setTimeout(() => (window.location.href = "login.html"), 1000);
    },
    error: function () {
      showToast("error", "Logout failed!");
    },
  });
}

function loadProducts() {
  if (!$("#products-list").length) return; // Prevent unnecessary execution

  $.ajax({
    url: "http://127.0.0.1:8000/api/products",
    method: "GET",
    headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    success: function (response) {
      let output = ""; // Initialize an empty string to store the product cards
      response.forEach((product) => {
        output += `
                    <div class="product-card">
                        <img src="logo.jpg" alt="${product.name}">
                        <h3>${product.name}</h3>
                        <p>Rs.${product.price}</p>
                        <button class="btn-block"onclick="addToCart(${product.id})">Add to Cart</button>
                    </div>
                `;
      });
      // Append the products to the products list
      $("#products-list").html(output);
    },
    error: function () {
      showToast("error", "Failed to load products.");
    },
  });
}

// Add to Cart
function addToCart(productId, quantity = 1) {
  let token = localStorage.getItem("token");

  if (!token) {
    showToast("error", "You need to log in first!");
    return;
  }

  $.ajax({
    url: "http://127.0.0.1:8000/api/cart",
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({ product_id: productId, quantity: quantity }),
    success: function (response) {
      showToast(
        "success",
        response.message || "Product added to cart successfully!"
      );
    },
    error: function (xhr) {
      let errorMsg = xhr.responseJSON
        ? xhr.responseJSON.message
        : "Failed to add product.";
      showToast("error", errorMsg);
    },
  });
}

// Load Cart
function loadCart() {
  if (!$("#cart-items").length) return; // Prevent execution if cart section is missing

  $.ajax({
    url: "http://127.0.0.1:8000/api/cart",
    method: "GET",
    headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    success: function (response) {
      if (response.cart.length === 0) {
        $("#cart-items").html("<p>Your cart is empty.</p>");
        $("#cart-total").html(""); // Clear total if empty
        return;
      }

      let output = '<div class="cart-container">';
      let totalPrice = 0; // Initialize total price

      response.cart.forEach((item) => {
        let price = parseFloat(item.product.price) || 0; // Ensure price is a number
        let itemTotal = price * item.quantity; // Item total
        totalPrice += itemTotal; // Add to grand total

        output += `
                    <div class="cart-item">
                        <img src="logo.jpg" alt="${
                          item.product.name
                        }" style="height: 100%">
                        <div>
                            <h4>${item.product.name}</h4>
                            <p>Price: Rs.${price.toFixed(2)}</p>
                            <p>Quantity: ${item.quantity}</p>
                            <p><strong>Subtotal: Rs.${itemTotal.toFixed(
                              2
                            )}</strong></p>
                            <button onclick="removeFromCart(${
                              item.id
                            })">Remove</button>
                        </div>
                    </div>
                `;
      });

      output += `
                </div>
                <div class="cart-total">
                    <h3><strong>Total Price: Rs.${totalPrice.toFixed(
                      2
                    )}</strong></h3>
                </div>
            `;

      $("#cart-items").html(output);
    },
    error: function () {
      showToast("error", "Failed to load cart.");
    },
  });
}

// Remove from Cart
function removeFromCart(cartItemId) {
  $.ajax({
    url: `http://127.0.0.1:8000/api/cart/${cartItemId}`,
    method: "DELETE",
    headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    success: function () {
      showToast("success", "Item removed from cart!");
      loadCart(); // Reload cart after removal
    },
    error: function () {
      showToast("error", "Failed to remove item.");
    },
  });
}

function fetchProducts() {
  $.ajax({
    url: "http://127.0.0.1:8000/api/products",
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    success: function (response) {
      let productTable = $("#product-list");
      productTable.empty(); // Clear table before inserting new data

      response.forEach((product, index) => {
        let statusText = product.status == 1 ? "Active" : "Inactive";
        let productRow = `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${product.name}</td>
                        <td>₹${product.price}</td>
                        <td>${product.stock_quantity}</td>
                        <td>${statusText}</td>
                        <td>
                            <button class="btn btn-warning btn-sm" onclick="editProduct(${
                              product.id
                            })">Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteProduct(${
                              product.id
                            })">Delete</button>
                        </td>
                    </tr>
                `;
        productTable.append(productRow);
      });
    },
    error: function () {
      toastr.error("Failed to load products.");
    },
  });
}

function deleteProduct(id) {
  if (confirm("Are you sure you want to delete this product?")) {
    $.ajax({
      url: `http://127.0.0.1:8000/api/products/${id}`,
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      success: function () {
        toastr.success("Product deleted successfully!");
        fetchProducts(); // Refresh the list
      },
      error: function () {
        toastr.error("Failed to delete product.");
      },
    });
  }
}

function editProduct(id) {
  window.location.href = `add-products.html?id=${id}`;
}

// Show Toastr Notification
function showToast(type, message) {
  toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-bottom-right",
    timeOut: 3000,
  };
  toastr[type](message);
}

// $(document).on("click", "button[type='submit']", function () {
//     let btn = $(this);

//     // Check if the loader already exists inside the button
//     if (btn.find(".spinner-border").length === 0) {
//         // Add the loader next to the text
//         btn.append('<div class="spinner-border spinner-border-sm ml-2" role="status"></div>');
//     }

//     // Disable button to prevent multiple clicks
//     btn.prop("disabled", true);
// });
