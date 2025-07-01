const apiUrl = "https://grocerybackend.up.railway.app/product";
const productList = document.getElementById("product-list");
const form = document.getElementById("product-form");

// Load existing products on page load
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await axios.get(apiUrl);
    res.data.forEach(product => {
      displayProduct(product);
    });
  } catch (err) {
    console.error("Failed to fetch products:", err);
  }
});

// Add new product
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const product = {
    name: document.getElementById("product-name").value.trim(),
    description: document.getElementById("product-desc").value.trim(),
    price: parseFloat(document.getElementById("product-price").value),
    qty: parseInt(document.getElementById("product-qty").value)
  };

  if (!product.name || !product.description || isNaN(product.price) || isNaN(product.qty)) {
    alert("Please fill out all fields correctly.");
    return;
  }

  try {
    const res = await axios.post(`${apiUrl}/add-product`, product);
    displayProduct(res.data);
    form.reset();
  } catch (err) {
    console.error("Failed to add product:", err);
  }
});

// Update quantity in-place without moving list items
async function updateQuantity(productId, updatedProduct) {
  if (updatedProduct.qty < 0) {
    alert("Not enough stock available!");
    return;
  }

  try {
    await axios.put(`${apiUrl}/update-product/${productId}`, updatedProduct);

    // Update the text content inside the existing <li>
    const liToUpdate = document.querySelector(`li[data-id="${productId}"]`);
    const details = liToUpdate.querySelector("span");

    details.textContent = `${updatedProduct.name} : ${updatedProduct.description} : ₹${updatedProduct.price} : Qty ${updatedProduct.qty}`;

  } catch (err) {
    console.error("Failed to update quantity:", err);
  }
}

// Display product in the product list
function displayProduct(product) {
  const li = document.createElement("li");
  li.setAttribute("data-id", product.id);

  const details = document.createElement("span");
  details.textContent = `${product.name} : ${product.description} : ₹${product.price} : Qty ${product.qty} `;

  // Buy 1 button
  const buy1Btn = createButton("Buy 1", "#ffc107", () => {
    const updatedProduct = { ...product, qty: product.qty - 1 };
    updateQuantity(product.id, updatedProduct);
    product.qty -= 1; // locally update for button clicks without page reload
  });

  // Buy 2 button
  const buy2Btn = createButton("Buy 2", "#17a2b8", () => {
    const updatedProduct = { ...product, qty: product.qty - 2 };
    updateQuantity(product.id, updatedProduct);
    product.qty -= 2;
  });

  // Buy 3 button
  const buy3Btn = createButton("Buy 3", "#dc3545", () => {
    const updatedProduct = { ...product, qty: product.qty - 3 };
    updateQuantity(product.id, updatedProduct);
    product.qty -= 3;
  });

  //Delete Button
  const _delete = createButton("DELETE", "#dc3545", async() => {
    try {
      await axios.delete(`${apiUrl}/delete-product/${product.id}`);
      
      // Remove the <li> from the DOM
      const liToDelete = document.querySelector(`li[data-id="${product.id}"]`);
      if (liToDelete) liToDelete.remove();
    } catch (error) {
        console.error("Failed to delete product:", error);
    }
  });

  // Append details and buttons to <li>
  li.appendChild(details);
  li.appendChild(buy1Btn);
  li.appendChild(buy2Btn);
  li.appendChild(buy3Btn);
  li.appendChild(_delete)

  // Append <li> to product list
  productList.appendChild(li);
}

// Button creator utility
function createButton(label, color, onClick) {
  const btn = document.createElement("input");
  btn.type = "button";
  btn.value = label;
  btn.style.padding = "10px";
  btn.style.margin = "5px";
  btn.style.backgroundColor = color;
  btn.style.color = "#fff";
  btn.style.border = "none";
  btn.style.borderRadius = "5px";
  btn.style.cursor = "pointer";
  btn.onclick = onClick;
  return btn;
}