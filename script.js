"use strict";

const products = [
  { id: "monstera", name: "Monstera", emoji: "🌿", category: "Indoor", price: 2400 },
  { id: "snake-plant", name: "Snake Plant", emoji: "🪴", category: "Indoor", price: 1850 },
  { id: "lavender", name: "Lavender", emoji: "💐", category: "Outdoor", price: 1200 },
  { id: "rosemary", name: "Rosemary", emoji: "🌱", category: "Outdoor", price: 950 },
  { id: "aloe-vera", name: "Aloe Vera", emoji: "🌵", category: "Succulents", price: 1100 },
  { id: "jade-plant", name: "Jade Plant", emoji: "🍀", category: "Succulents", price: 1500, outOfStock: true }
];
const CART_KEY = "leaf-and-co2-cart";
const ORDER_KEY = "leaf-and-co2-last-order";
const byId = id => document.getElementById(id);
const money = cents => `$${(cents / 100).toFixed(2)}`;
const productFor = id => products.find(product => product.id === id);
const page = document.body.dataset.page;

function readSaved(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}
const savedCart = readSaved(CART_KEY, []);
let cart = Array.isArray(savedCart) ? savedCart.filter(item =>
  item && productFor(item.id) && !productFor(item.id).outOfStock &&
  Number.isSafeInteger(item.quantity) && item.quantity > 0) : [];
const subtotal = () => cart.reduce((sum, item) => sum + productFor(item.id).price * item.quantity, 0);

function updateCount() {
  byId("cart-count").textContent = `(${cart.reduce((sum, item) => sum + item.quantity, 0)})`;
}
function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCount();
}
function changeQuantity(id, change) {
  if (!productFor(id) || productFor(id).outOfStock) return;
  const item = cart.find(entry => entry.id === id);
  if (item) item.quantity += change;
  else if (change > 0) cart.push({ id, quantity: 1 });
  cart = cart.filter(entry => entry.quantity > 0);
  saveCart();
}

function renderShop() {
  byId("product-grid").innerHTML = products.map(product => `
    <article id="product-${product.id}" class="product-card" data-category="${product.category}">
      <div class="plant-emoji"><span aria-hidden="true">${product.emoji}</span>
        ${product.outOfStock ? '<span class="stock-status">Out of stock</span>' : ''}</div>
      <h2>${product.name}</h2>
      <p class="category-name">${product.category}</p>
      <div class="product-footer">
        <p id="price-${product.id}" class="price">${money(product.price)}</p>
        ${product.id === "monstera" ? "" : `<button id="add-${product.id}" type="button" data-product="${product.id}" ${product.outOfStock ? 'disabled' : ''}>Add to cart</button>`}
      </div>
    </article>`).join("");
  byId("category").addEventListener("change", event => {
    document.querySelectorAll(".product-card").forEach(card => {
      card.hidden = event.target.value !== "All" && card.dataset.category !== event.target.value;
    });
  });
  byId("product-grid").addEventListener("click", event => {
    const button = event.target.closest("button[data-product]");
    if (button) changeQuantity(button.dataset.product, 1);
  });
}

function renderCart() {
  byId("empty-cart").hidden = cart.length > 0;
  byId("checkout-button").hidden = cart.length === 0;
  byId("cart-items").innerHTML = cart.map(item => {
    const product = productFor(item.id);
    return `<li id="cart-item-${item.id}" class="cart-item">
      <div><h2>${product.name}</h2><p id="unit-price-${item.id}" class="item-price">${money(product.price)} each</p></div>
      <div class="quantity-controls">
        <button id="decrease-${item.id}" class="secondary" type="button" data-id="${item.id}" data-action="decrease" aria-label="Decrease ${product.name} quantity">-</button>
        <span id="quantity-${item.id}">Quantity: ${item.quantity}</span>
        <button id="increase-${item.id}" class="secondary" type="button" data-id="${item.id}" data-action="increase" aria-label="Increase ${product.name} quantity">+</button>
      </div>
      <button id="remove-${item.id}" class="secondary" type="button" data-id="${item.id}" data-action="remove">Remove</button>
      <p id="line-total-${item.id}" class="line-total">Line total: ${money(product.price * item.quantity)}</p>
    </li>`;
  }).join("");
  byId("cart-subtotal").textContent = `Subtotal: ${money(subtotal())}`;
}

function placeOrder(event) {
  event.preventDefault();
  if (!cart.length) { location.replace("cart.html"); return; }
  let firstInvalid;
  const customer = {};
  ["full-name", "email", "address"].forEach(id => {
    const field = byId(id);
    const value = field.value.trim();
    customer[id] = value;
    let error = value ? "" : `Enter your ${id === "full-name" ? "full name" : id}`;
    if (id === "email" && value && (!value.includes("@") || !value.includes("."))) error = "Enter a valid email";
    byId(`${id}-error`).textContent = error;
    field.setAttribute("aria-invalid", String(Boolean(error)));
    if (error && !firstInvalid) firstInvalid = field;
  });
  if (firstInvalid) { firstInvalid.focus(); return; }
  const order = {
    number: Math.floor(100000 + Math.random() * 900000),
    customer,
    items: cart.map(item => ({ name: productFor(item.id).name, price: productFor(item.id).price, quantity: item.quantity })),
    total: subtotal()
  };
  localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  cart = [];
  saveCart();
  location.assign("confirmation.html");
}

function renderConfirmation() {
  const order = readSaved(ORDER_KEY, null);
  if (!order || !Array.isArray(order.items) || !order.items.length) { location.replace("index.html"); return; }
  byId("order-number").textContent = `Order number: ${order.number}`;
  order.items.forEach((item, index) => {
    const row = document.createElement("li");
    row.className = "order-item";
    const name = document.createElement("span");
    name.textContent = `${item.name} × ${item.quantity}`;
    const total = document.createElement("span");
    total.id = `order-line-total-${index + 1}`;
    total.textContent = money(item.price * item.quantity);
    row.append(name, total);
    byId("order-items").append(row);
  });
  byId("order-total").textContent = `Total: ${money(order.total)}`;
}

updateCount();
if (page === "shop") renderShop();
if (page === "cart") {
  renderCart();
  byId("cart-items").addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const { id, action } = button.dataset;
    if (action === "remove") { cart = cart.filter(item => item.id !== id); saveCart(); }
    else changeQuantity(id, action === "increase" ? 1 : -1);
    renderCart();
    (byId(button.id) || byId("cart-items").querySelector("button") || byId("shop-link")).focus();
  });
  byId("checkout-button").addEventListener("click", () => location.assign("checkout.html"));
}
if (page === "checkout") {
  if (!cart.length) location.replace("cart.html");
  else byId("checkout-form").addEventListener("submit", placeOrder);
}
if (page === "confirmation") renderConfirmation();
