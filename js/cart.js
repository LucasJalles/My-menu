// js/cart.js
let cartItems = [];
let nextCartItemId = 1;

export function getCart() {
    return [...cartItems];
}

export function addItemToCart(itemData) {
    const newItem = { ...itemData, cartItemId: nextCartItemId++ };
    cartItems.push(newItem);
}

export function updateCartItemQuantity(cartItemId, change) {
    const itemIndex = cartItems.findIndex(item => item.cartItemId === cartItemId);
    if (itemIndex > -1) {
        cartItems[itemIndex].quantity += change;
        if (cartItems[itemIndex].quantity <= 0) {
            cartItems.splice(itemIndex, 1);
        } else {
            cartItems[itemIndex].totalPrice = cartItems[itemIndex].unitPrice * cartItems[itemIndex].quantity;
        }
    }
}

export function removeItemFromCart(cartItemId) {
    cartItems = cartItems.filter(item => item.cartItemId !== cartItemId);
}

export function clearCart() {
    cartItems = [];
}

export function getCartTotalItems() {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartGrandTotal() {
    return cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
}