// Menu/js/eventHandlers.js
import * as DOM from './domElements.js';
import { openModal, closeModal, switchView, renderCategories, renderCategoryItemsCarousel, showInlineCustomizationPanel, hideInlineCustomizationPanel, updateInlineCustomizationDetailsDisplay, highlightSelectedCarouselItem, renderCartDetailed, updateCartSummary, openCartModal as openCartModalRenderer, showMessage } from './uiRenderer.js';
import * as Cart from './cart.js';
import * as Menu from './menu.js';
import * as WhatsApp from './whatsapp.js';
import * as Auth from './auth.js';
import * as Admin from './admin.js';

// --- HANDLERS PARA A ÁREA PÚBLICA DO MENU ---

function handleCategoryClick(event) {
    console.log("eventHandlers.js: Categoria clicada.");
    const card = event.target.closest('.category-card');
    if (!card) return;
    
    // Esconde o dropdown de opções ao mudar de view
    if (DOM.optionsDropdown?.classList.contains('show')) {
        DOM.optionsDropdown.classList.remove('show');
    }

    const categoryId = card.dataset.categoryId;
    const categoryName = card.dataset.categoryName;
    Menu.fetchItems(categoryId).then(items => {
        renderCategoryItemsCarousel(categoryName, items);
        switchView('items-view');
    }).catch(error => {
        console.error("Erro ao carregar itens da categoria:", error);
        showMessage('error', 'Não foi possível carregar os itens desta categoria.');
    });
}

function handleCarouselItemSelect(event) {
    console.log("eventHandlers.js: Item do carrossel clicado.");
    const card = event.target.closest('.item-carousel-card');
    if (!card) return;

    // Esconde o dropdown de opções ao selecionar um item
    if (DOM.optionsDropdown?.classList.contains('show')) {
        DOM.optionsDropdown.classList.remove('show');
    }

    const itemId = card.dataset.itemId;
    const item = Menu.getItemById(itemId); 
    
    if (item) {
        if (highlightSelectedCarouselItem.previouslySelectedCarouselCard === card && DOM.inlineCustomizationPanel.classList.contains('active')) {
            hideInlineCustomizationPanel();
            highlightSelectedCarouselItem(null);
            Menu.setCurrentItemForCustomization(null);
        } else {
            Menu.setCurrentItemForCustomization(item);
            highlightSelectedCarouselItem(card);
            showInlineCustomizationPanel(item);
        }
    } else {
        console.warn(`Item com ID ${itemId} não encontrado em Menu.allItems.`);
        showMessage('error', 'Item não encontrado. Tente recarregar a página.');
    }
}

// --- HANDLERS DO PAINEL DE PERSONALIZAÇÃO ---

function handleInlineDefaultIngredientToggle(event) {
    console.log("eventHandlers.js: Toggle de ingrediente padrão."); 
    const button = event.target.closest('.toggle-ingredient-control'); 
    if (!button) return; 

    const diId = button.dataset.diId; 
    if (diId === undefined) { 
        console.warn("AVISO: Ingrediente fixo clicado ou sem ID definido.");
        return;
    }
    
    if (Menu.updateCustomizationState('defaultIngredientToggle', diId)) {
        updateInlineCustomizationDetailsDisplay();
    }
}

function handleInlineCustomOptionQuantityChange(event) {
    console.log("eventHandlers.js: Alteração de quantidade de opção customizável."); 
    const button = event.target.closest('.inline-decrease-co-qty, .inline-increase-co-qty'); 
    if (!button) return;

    const coId = button.dataset.coId; 
    if (coId === undefined) { 
        console.warn("AVISO: Botão de quantidade sem ID definido.");
        return;
    }

    const isIncrease = button.classList.contains('inline-increase-co-qty');
    const currentItem = Menu.getCurrentItemBeingCustomized();
    if (!currentItem) return;

    const optionConfig = currentItem.customizable_options.find(opt => opt.id_name === coId); 
    if (!optionConfig || optionConfig.option_type !== 'add') {
        console.warn("AVISO: Configuração de opção customizável inválida ou não é do tipo 'add'.");
        return;
    }

    let currentQtyState = Menu.currentCustomizationState.customizableOptions[coId] || 0;
    const newQty = isIncrease ? currentQtyState + 1 : currentQtyState - 1;

    if (Menu.updateCustomizationState('addOptionQuantity', coId, newQty)) {
        updateInlineCustomizationDetailsDisplay();
    }
}

function handleInlineVariantOptionSelect(event) {
    console.log("eventHandlers.js: Seleção de opção variante."); 
    const button = event.target.closest('.variant-button'); 
    if (!button) return;

    const coId = button.dataset.coId;
    const variantGroup = button.dataset.variantGroup;
    if (coId === undefined || variantGroup === undefined) { 
        console.warn("AVISO: Botão de variante sem ID ou grupo definido.");
        return;
    }

    if (Menu.updateCustomizationState('variantOptionSelect', variantGroup, coId)) {
        updateInlineCustomizationDetailsDisplay();
    }
}

function handleInlineItemOverallQuantityChange(isIncrease) {
    console.log("eventHandlers.js: Alteração de quantidade geral do item."); 
    let currentVal = Menu.currentCustomizationState.overallQuantity;
    const newVal = isIncrease ? currentVal + 1 : (currentVal > 1 ? currentVal - 1 : 1);
    if (Menu.updateCustomizationState('overallQuantity', null, newVal)) {
        updateInlineCustomizationDetailsDisplay();
    }
}

function handleAddInlineItemToCart() {
    console.log("eventHandlers.js: Adicionar item ao carrinho (inline)."); 
    const currentItemBase = Menu.getCurrentItemBeingCustomized();
    if (!currentItemBase) {
        showMessage('info', "Por favor, selecione um item para personalizar.");
        return;
    }

    const unitPrice = Menu.calculateUnitPrice();
    const overallQuantity = Menu.currentCustomizationState.overallQuantity;
    const customizations = Menu.getFinalizedCustomizationDetailsForCart();

    if (overallQuantity < 1) {
        showMessage('info', "A quantidade deve ser pelo menos 1.");
        return;
    }

    Cart.addItemToCart({
        baseItemId: currentItemBase.id,
        name: currentItemBase.name,
        quantity: overallQuantity,
        unitPrice: unitPrice,
        totalPrice: unitPrice * overallQuantity,
        customizations: customizations
    });

    updateCartSummary();
    hideInlineCustomizationPanel();
    highlightSelectedCarouselItem(null);
    Menu.setCurrentItemForCustomization(null);
    showMessage('success', `${overallQuantity}x ${currentItemBase.name} adicionado ao carrinho!`);
}

// --- HANDLERS DO CARRINHO ---

function handleCartQuantityChange(event) {
    console.log("eventHandlers.js: Evento de alteração de quantidade no carrinho detectado.");
    const button = event.target.closest('.cart-decrease-qty, .cart-increase-qty');
    if (!button) {
        console.warn("AVISO: Clique de quantidade no carrinho não veio de um botão válido.");
        return;
    }
    const cartItemId = Number(button.dataset.cartItemId);
    console.log(`eventHandlers.js: Cart Item ID clicado (quantidade): ${cartItemId}`);
    if (isNaN(cartItemId)) {
        console.error("ERRO: data-cart-item-id inválido ou ausente no botão de quantidade do carrinho.");
        showMessage('error', 'Erro ao alterar quantidade do item no carrinho.');
        return;
    }

    const change = button.matches('.cart-increase-qty') ? 1 : -1;
    Cart.updateCartItemQuantity(cartItemId, change);
    renderCartDetailed();
    updateCartSummary();
    console.log(`eventHandlers.js: Quantidade do item ${cartItemId} alterada em ${change}.`);
    // Opcional: showMessage('info', 'Quantidade do item atualizada.');
}

function handleRemoveItemFromCart(event) {
    console.log("eventHandlers.js: Evento de remover item do carrinho detectado.");
    const button = event.target.closest('.cart-remove-item');
    if (!button) {
        console.warn("AVISO: Clique de remover no carrinho não veio de um botão válido.");
        return;
    }
    const cartItemId = Number(button.dataset.cartItemId);
    console.log(`eventHandlers.js: Cart Item ID clicado (remover): ${cartItemId}`);
     if (isNaN(cartItemId)) {
        console.error("ERRO: data-cart-item-id inválido ou ausente no botão de remover do carrinho.");
        showMessage('error', 'Erro ao remover item do carrinho.');
        return;
    }

    if (confirm("Remover este item do pedido?")) {
        Cart.removeItemFromCart(cartItemId);
        renderCartDetailed();
        updateCartSummary();
        console.log(`eventHandlers.js: Item ${cartItemId} removido.`);
        showMessage('info', 'Item removido do carrinho.');
    }
}

function handleCheckout() {
    console.log("eventHandlers.js: Finalizar pedido (Checkout).");
    const cartData = Cart.getCart();
    if (cartData.length === 0) {
        showMessage('info', 'Seu carrinho está vazio!');
        return;
    }
    const grandTotal = Cart.getCartGrandTotal();
    const message = WhatsApp.generateWhatsAppMessage(cartData, grandTotal);
    WhatsApp.sendOrderToWhatsApp(message);
    showMessage('success', 'Seu pedido foi gerado para o WhatsApp!');
    Cart.clearCart();
    renderCartDetailed();
    updateCartSummary();
}

function handleClearCart() {
    console.log("eventHandlers.js: Limpar carrinho.");
    if (Cart.getCart().length > 0 && confirm('Tem certeza que deseja limpar o carrinho?')) {
        Cart.clearCart();
        renderCartDetailed();
        updateCartSummary();
        showMessage('info', 'Carrinho limpo.');
    }
}

// --- HANDLERS DE AUTENTICAÇÃO E ADMIN ---

async function handleLoginModalSubmit(event) {
    console.log("eventHandlers.js: Formulário de login submetido.");
    event.preventDefault();
    const username = DOM.modalUsernameInput.value.trim();
    const password = DOM.modalPasswordInput.value;

    DOM.modalLoginMessage.textContent = '';

    if (!username || !password) {
        DOM.modalLoginMessage.textContent = 'Usuário e senha são obrigatórios.';
        DOM.modalLoginMessage.classList.add('error-message');
        showMessage('error', 'Usuário e senha são obrigatórios.');
        return;
    }

    DOM.modalLoginMessage.textContent = 'Autenticando...';
    DOM.modalLoginMessage.classList.remove('error-message');
    DOM.modalLoginMessage.style.color = 'var(--text-dark)';

    const result = await Auth.login(username, password);

    if (result.success) {
        console.log("eventHandlers.js: Login bem-sucedido.");
        DOM.modalLoginMessage.textContent = 'Login bem-sucedido!';
        DOM.modalLoginMessage.style.color = 'var(--success-color)';
        showMessage('success', 'Login realizado com sucesso!');

        DOM.modalUsernameInput.value = '';
        DOM.modalPasswordInput.value = '';

        closeModal('login-modal');
        // Após login, o usuário vai para o painel de administração
        switchView('admin-panel-view');
        Admin.initializeAdminPanel();
        
        // Esconde o botão de Login e mostra o de Sair no dropdown (ou vice-versa)
        updateMoreOptionsButtonsVisibility(); 

    } else {
        console.log("eventHandlers.js: Erro no login:", result.message);
        DOM.modalLoginMessage.textContent = result.message || 'Credenciais inválidas.';
        DOM.modalLoginMessage.classList.add('error-message');
        showMessage('error', result.message || 'Credenciais inválidas.');
    }
}

function handleAuthPanelButtonClick() {
    console.log("eventHandlers.js: Botão Auth Panel clicado (dentro do dropdown).");
    // Esconde o dropdown ao clicar no botão
    if (DOM.optionsDropdown?.classList.contains('show')) {
        DOM.optionsDropdown.classList.remove('show');
    }

    if (Auth.isAuthenticated()) {
        console.log("eventHandlers.js: Usuário autenticado, trocando para admin-panel-view.");
        switchView('admin-panel-view');
        Admin.initializeAdminPanel();
    } else {
        console.log("eventHandlers.js: Usuário NÃO autenticado, abrindo modal de login.");
        openModal('login-modal');
    }
}

function handleLogoutButtonClick() {
    console.log("eventHandlers.js: Botão de Logout clicado (dentro do dropdown).");
    // Esconde o dropdown ao clicar no botão
    if (DOM.optionsDropdown?.classList.contains('show')) {
        DOM.optionsDropdown.classList.remove('show');
    }

    Auth.logout();
    // Após logout, o usuário retorna ao cardápio público
    switchView('categories-view');
    showMessage('info', 'Você foi desconectado.');
    // Atualiza a visibilidade dos botões no dropdown após logout
    updateMoreOptionsButtonsVisibility(); 
    // Recarregar categorias para garantir o estado público (sem opções de admin)
    Menu.fetchCategories().then(categories => {
        renderCategories(categories);
    }).catch(error => {
        console.error("Erro ao recarregar categorias após logout:", error);
        showMessage('error', 'Erro ao carregar categorias após logout.');
    });
}

// NOVO: Função para atualizar a visibilidade dos botões do dropdown
export function updateMoreOptionsButtonsVisibility() {
    if (Auth.isAuthenticated()) {
        DOM.authPanelButton.style.display = 'none'; // Esconde o botão de Login
        DOM.logoutButton.style.display = 'block';   // Mostra o botão de Sair
    } else {
        DOM.authPanelButton.style.display = 'block'; // Mostra o botão de Login
        DOM.logoutButton.style.display = 'none';   // Esconde o botão de Sair
    }
}

// NOVO: Handler para o botão de 3 pontinhos
function handleMoreOptionsButtonClick(event) {
    event.stopPropagation(); // Impede que o clique se propague e feche o dropdown imediatamente
    DOM.optionsDropdown?.classList.toggle('show');
    console.log("DEBUG: Botão de 3 pontinhos clicado. Dropdown visível:", DOM.optionsDropdown?.classList.contains('show'));
}

// NOVO: Handler para fechar o dropdown ao clicar fora
function handleDocumentClick(event) {
    if (DOM.optionsDropdown?.classList.contains('show') && !DOM.moreOptionsContainer?.contains(event.target)) {
        DOM.optionsDropdown.classList.remove('show');
        console.log("DEBUG: Clique fora do dropdown, escondendo.");
    }
}


// --- FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO DOS EVENTOS ---

export function initializeEventListeners() {
    console.log("eventHandlers.js: initializeEventListeners chamado.");
    DOM.loginForm?.addEventListener('submit', handleLoginModalSubmit);
    
    // Adicionar listener ao novo botão de 3 pontinhos
    DOM.moreOptionsButton?.addEventListener('click', handleMoreOptionsButtonClick);
    // Os listeners de authPanelButton e logoutButton agora apontam para os botões DENTRO do dropdown
    DOM.authPanelButton?.addEventListener('click', handleAuthPanelButtonClick);
    DOM.logoutButton?.addEventListener('click', handleLogoutButtonClick);
    
    // O botão de adicionar categoria/item está no painel de admin, não precisa de 3 pontinhos
    if (DOM.addCategoryButton) {
        DOM.addCategoryButton.addEventListener('click', Admin.handleAddCategory);
        console.log("eventHandlers.js: Listener para addCategoryButton anexado.");
    }
    if (DOM.addItemButton) {
        DOM.addItemButton.addEventListener('click', Admin.handleAddItem);
        console.log("eventHandlers.js: Listener para addItemButton anexado.");
    }

    DOM.viewCartButton?.addEventListener('click', () => openCartModalRenderer());
    DOM.clearCartButton?.addEventListener('click', handleClearCart);
    DOM.checkoutButtonDetailed?.addEventListener('click', handleCheckout);
    DOM.closeInlinePanelButton?.addEventListener('click', hideInlineCustomizationPanel);
    DOM.inlineDecreaseItemQuantityButton?.addEventListener('click', () => handleInlineItemOverallQuantityChange(false));
    DOM.inlineIncreaseItemQuantityButton?.addEventListener('click', () => handleInlineItemOverallQuantityChange(true));
    DOM.inlineAddToCartButton?.addEventListener('click', handleAddInlineItemToCart);

    DOM.categoriesContainer?.addEventListener('click', handleCategoryClick);
    DOM.itemsCarouselContainer?.addEventListener('click', handleCarouselItemSelect);
    
    DOM.inlineDefaultIngredientsList?.addEventListener('click', e => {
        const targetButton = e.target.closest('.toggle-ingredient-control');
        if (targetButton) handleInlineDefaultIngredientToggle(e);
    });
    DOM.inlineCustomizableOptionsList?.addEventListener('click', e => {
        const targetButton = e.target.closest('.inline-decrease-co-qty, .inline-increase-co-qty');
        if (targetButton) handleInlineCustomOptionQuantityChange(e);
        const variantButton = e.target.closest('.variant-button');
        if (variantButton) handleInlineVariantOptionSelect(e);
    });
    DOM.cartItemsDetailedContainer?.addEventListener('click', e => {
        if (e.target.closest('.cart-decrease-qty, .cart-increase-qty')) handleCartQuantityChange(e);
        if (e.target.closest('.cart-remove-item')) handleRemoveItemFromCart(e);
    });


    DOM.allCloseButtons.forEach(button => {
        button.addEventListener('click', () => closeModal(button.dataset.modalId));
    });
    window.addEventListener('click', (event) => {
        if (event.target === DOM.cartModal) closeModal('cart-modal');
        if (event.target === DOM.loginModal) closeModal('login-modal');
        if (event.target.id === 'category-modal') closeModal('category-modal');
        if (event.target.id === 'item-modal') closeModal('item-modal');
        // Novo: Fechar o dropdown de 3 pontinhos ao clicar fora
        handleDocumentClick(event);
    });

    DOM.allBackButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Esconde o dropdown de opções ao voltar para outras views
            if (DOM.optionsDropdown?.classList.contains('show')) {
                DOM.optionsDropdown.classList.remove('show');
            }
            switchView(e.target.dataset.targetView);
        });
    });

    DOM.adminTabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            console.log("eventHandlers.js: Aba Admin clicada:", e.target.dataset.targetTab);
            // Esconde o dropdown de opções ao interagir com o painel de admin
            if (DOM.optionsDropdown?.classList.contains('show')) {
                DOM.optionsDropdown.classList.remove('show');
            }
            Admin.switchAdminTab(e.target.dataset.targetTab);
        });
    });
    console.log("eventHandlers.js: Todos os listeners principais inicializados.");
}