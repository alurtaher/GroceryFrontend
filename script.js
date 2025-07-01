const apiUrl = "https://grocerybackend.up.railway.app/product";
const productList = document.getElementById("product-list");
const form = document.getElementById("product-form");
const searchInput = document.getElementById("search-input");
const emptyState = document.getElementById("empty-state");
const loadingOverlay = document.getElementById("loading-overlay");
const toastContainer = document.getElementById("toast-container");

let products = [];
let filteredProducts = [];

// Utility Functions
function showLoading() {
  loadingOverlay.classList.add("show");
}

function hideLoading() {
  loadingOverlay.classList.remove("show");
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  const iconSvg = getToastIcon(type);
  
  toast.innerHTML = `
    ${iconSvg}
    <span class="toast-message">${message}</span>
  `;
  
  toastContainer.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add("show"), 100);
  
  // Remove toast after 4 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function getToastIcon(type) {
  const icons = {
    success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--success-color)">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22,4 12,14.01 9,11.01"></polyline>
    </svg>`,
    error: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--danger-color)">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>`,
    warning: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--warning-color)">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>`,
    info: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--info-color)">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>`
  };
  return icons[type] || icons.info;
}

function updateStats() {
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => sum + (product.price * product.qty), 0);
  
  document.getElementById("total-products").textContent = totalProducts;
  document.getElementById("total-value").textContent = `₹${totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatPrice(price) {
  return `₹${parseFloat(price).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function getQuantityBadgeClass(qty) {
  if (qty <= 5) return "quantity-badge low-stock";
  return "quantity-badge";
}

// Load existing products on page load
window.addEventListener("DOMContentLoaded", async () => {
  showLoading();
  try {
    const res = await axios.get(apiUrl);
    products = res.data;
    filteredProducts = [...products];
    renderProducts();
    updateStats();
    showToast("Products loaded successfully!");
  } catch (err) {
    console.error("Failed to fetch products:", err);
    showToast("Failed to load products. Please try again.", "error");
  } finally {
    hideLoading();
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
    showToast("Please fill out all fields correctly.", "warning");
    return;
  }

  if (product.price < 0 || product.qty < 0) {
    showToast("Price and quantity must be positive numbers.", "warning");
    return;
  }

  showLoading();
  try {
    const res = await axios.post(`${apiUrl}/add-product`, product);
    products.push(res.data);
    filteredProducts = [...products];
    renderProducts();
    updateStats();
    form.reset();
    showToast(`${product.name} added successfully!`);
  } catch (err) {
    console.error("Failed to add product:", err);
    showToast("Failed to add product. Please try again.", "error");
  } finally {
    hideLoading();
  }
});

// Search functionality
searchInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase().trim();
  
  if (searchTerm === "") {
    filteredProducts = [...products];
  } else {
    filteredProducts = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm)
    );
  }
  
  renderProducts();
});

// Update quantity function
async function updateQuantity(productId, updatedProduct) {
  if (updatedProduct.qty < 0) {
    showToast("Not enough stock available!", "warning");
    return;
  }

  showLoading();
  try {
    await axios.put(`${apiUrl}/update-product/${productId}`, updatedProduct);

    // Update local products array
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
      products[productIndex] = updatedProduct;
      filteredProducts = products.filter(product =>
        searchInput.value === "" ||
        product.name.toLowerCase().includes(searchInput.value.toLowerCase()) ||
        product.description.toLowerCase().includes(searchInput.value.toLowerCase())
      );
      renderProducts();
      updateStats();
    }

    showToast("Quantity updated successfully!");
  } catch (err) {
    console.error("Failed to update quantity:", err);
    showToast("Failed to update quantity. Please try again.", "error");
  } finally {
    hideLoading();
  }
}

// Delete product function
async function deleteProduct(productId, productName) {
  if (!confirm(`Are you sure you want to delete "${productName}"?`)) {
    return;
  }

  showLoading();
  try {
    await axios.delete(`${apiUrl}/delete-product/${productId}`);
    
    products = products.filter(p => p.id !== productId);
    filteredProducts = filteredProducts.filter(p => p.id !== productId);
    renderProducts();
    updateStats();
    showToast(`${productName} deleted successfully!`);
  } catch (error) {
    console.error("Failed to delete product:", error);
    showToast("Failed to delete product. Please try again.", "error");
  } finally {
    hideLoading();
  }
}

// Render products function
function renderProducts() {
  productList.innerHTML = "";
  
  if (filteredProducts.length === 0) {
    emptyState.style.display = "block";
    return;
  }
  
  emptyState.style.display = "none";
  
  filteredProducts.forEach(product => {
    const productCard = document.createElement("div");
    productCard.className = "product-card fade-in";
    productCard.setAttribute("data-id", product.id);

    productCard.innerHTML = `
      <div class="product-header">
        <div class="product-info">
          <h3>${escapeHtml(product.name)}</h3>
          <p>${escapeHtml(product.description)}</p>
        </div>
        <div class="product-price">${formatPrice(product.price)}</div>
      </div>
      
      <div class="product-meta">
        <span class="${getQuantityBadgeClass(product.qty)}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          </svg>
          ${product.qty} in stock
        </span>
        ${product.qty <= 5 ? '<span style="color: var(--danger-color); font-size: 0.75rem; font-weight: 500;">Low Stock!</span>' : ''}
      </div>
      
      <div class="product-actions">
        <button class="btn btn-success btn-sm" onclick="buyProduct(${product.id}, 1, '${escapeHtml(product.name)}')">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          Buy 1
        </button>
        <button class="btn btn-info btn-sm" onclick="buyProduct(${product.id}, 2, '${escapeHtml(product.name)}')">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          Buy 2
        </button>
        <button class="btn btn-warning btn-sm" onclick="buyProduct(${product.id}, 3, '${escapeHtml(product.name)}')">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          Buy 3
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id}, '${escapeHtml(product.name)}')">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3,6 5,6 21,6"></polyline>
            <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
          Delete
        </button>
      </div>
    `;

    productList.appendChild(productCard);
  });
}

// Buy product function
function buyProduct(productId, quantity, productName) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  if (product.qty < quantity) {
    showToast(`Not enough stock! Only ${product.qty} ${productName} available.`, "warning");
    return;
  }

  const updatedProduct = { ...product, qty: product.qty - quantity };
  updateQuantity(productId, updatedProduct);
}

// Utility function to escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + K to focus search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    searchInput.focus();
  }
  
  // Escape to clear search
  if (e.key === 'Escape' && document.activeElement === searchInput) {
    searchInput.value = '';
    filteredProducts = [...products];
    renderProducts();
    searchInput.blur();
  }
});

// Add smooth scrolling for better UX
document.documentElement.style.scrollBehavior = 'smooth';

// Initialize tooltips and other interactive elements
document.addEventListener('DOMContentLoaded', () => {
  // Add focus management for better accessibility
  const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const modal = document.querySelector('.modal'); // If you add modals later
  
  // Trap focus in modals when they're open
  if (modal) {
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const focusable = modal.querySelectorAll(focusableElements);
        const firstFocusable = focusable[0];
        const lastFocusable = focusable[focusable.length - 1];
        
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            e.preventDefault();
          }
        }
      }
    });
  }
});