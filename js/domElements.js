// Menu/js/domElements.js
export const categoriesView = document.getElementById('categories-view');
export const itemsView = document.getElementById('items-view');
export const categoriesContainer = document.getElementById('categories-container');
export const itemsCategoryTitle = document.getElementById('items-category-title');
export const itemsCarouselContainer = document.getElementById('items-carousel-container');

export const inlineCustomizationPanel = document.getElementById('inline-customization-panel');
export const inlineCustomItemName = document.getElementById('inline-custom-item-name');
export const inlineCustomItemImage = document.getElementById('inline-custom-item-image');
export const inlineCustomItemBasePrice = document.getElementById('inline-custom-item-base-price');
export const inlineDefaultIngredientsList = document.getElementById('inline-default-ingredients-list');
export const inlineCustomizableOptionsList = document.getElementById('inline-customizable-options-list');
export const inlineItemQuantityInput = document.getElementById('inline-item-quantity');
export const inlineDecreaseItemQuantityButton = document.getElementById('inline-decrease-item-quantity');
export const inlineIncreaseItemQuantityButton = document.getElementById('inline-increase-item-quantity');
export const inlineCustomItemUnitPriceDisplay = document.getElementById('inline-custom-item-unit-price');
export const inlineCustomItemTotalPriceDisplay = document.getElementById('inline-custom-item-total-price');
export const inlineAddToCartButton = document.getElementById('inline-add-to-cart-button');
export const closeInlinePanelButton = document.getElementById('close-inline-panel-button');

export const cartModal = document.getElementById('cart-modal');
export const cartItemsDetailedContainer = document.getElementById('cart-items-detailed');
export const totalPriceDetailed = document.getElementById('total-price-detailed');
export const checkoutButtonDetailed = document.getElementById('checkout-button-detailed');
export const clearCartButton = document.getElementById('clear-cart-button');
export const viewCartButton = document.getElementById('view-cart-button');

export const cartCountSummary = document.getElementById('cart-count');
export const cartTotalSummary = document.getElementById('cart-total-summary');

export const allModals = document.querySelectorAll('.modal');
export const allCloseButtons = document.querySelectorAll('.close-button');
export const allBackButtons = document.querySelectorAll('.back-button');

// ELEMENTOS PARA O LOGIN / PAINEL DE ADMINISTRAÇÃO DO CLIENTE
export const loginModal = document.getElementById('login-modal');
export const loginForm = document.getElementById('login-form');
export const modalUsernameInput = document.getElementById('modal-username');
export const modalPasswordInput = document.getElementById('modal-password');
export const modalLoginButton = document.getElementById('modal-login-button');
export const modalLoginMessage = document.getElementById('modal-login-message');

// Elementos para o menu de 3 pontinhos
export const moreOptionsContainer = document.getElementById('more-options-container');
export const moreOptionsButton = document.getElementById('more-options-button');
export const optionsDropdown = document.getElementById('options-dropdown');

// Os botões authPanelButton e logoutButton estão dentro de optionsDropdown
export const authPanelButton = document.getElementById('auth-panel-button');
export const logoutButton = document.getElementById('logout-button');

export const adminPanelView = document.getElementById('admin-panel-view');

export const adminTabButtons = document.querySelectorAll('.admin-tab-button');
export const adminTabContents = document.querySelectorAll('.admin-tab-content');

export const categoriesAdminList = document.getElementById('categories-admin-list');
export const itemsAdminList = document.getElementById('items-admin-list');

export const addCategoryButton = document.getElementById('add-category-button');
export const addItemButton = document.getElementById('add-item-button');

export const loadingOverlay = document.getElementById('loading-overlay'); 

// Contêiner para mensagens de feedback
export const feedbackMessagesContainer = document.getElementById('feedback-messages-container');