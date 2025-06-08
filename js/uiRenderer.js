// Menu/js/uiRenderer.js
import * as DOM from './domElements.js';
import * as Cart from './cart.js';
import * as Menu from './menu.js';

// --- CONTROLE DE VISIBILIDADE ---

export function switchView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active-view');
    });
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active-view');
        console.log(`DEBUG: Visualização alterada para: ${viewId}`); 
    }
    hideInlineCustomizationPanel();

    // NOVO: Controla a visibilidade do container de 3 pontinhos com base na view
    if (DOM.moreOptionsContainer) {
        if (viewId === 'admin-panel-view') {
            DOM.moreOptionsContainer.classList.add('more-options-hidden');
        } else {
            DOM.moreOptionsContainer.classList.remove('more-options-hidden');
        }
        // Garante que o dropdown esteja fechado ao mudar de view
        if (DOM.optionsDropdown?.classList.contains('show')) {
            DOM.optionsDropdown.classList.remove('show');
        }
    }
    if (DOM.backArrowButton) {
        if (viewId === 'categories-view') {
            DOM.backArrowButton.classList.add('back-arrow-hidden'); // Esconde na tela de categorias
        } else {
            // ESTA É A LINHA QUE DEVE SER ATIVADA PARA MOSTRAR A SETA EM OUTRAS TELAS (como 'items-view')
            DOM.backArrowButton.classList.remove('back-arrow-hidden'); // Mostra nas outras telas
        }
        // Atualiza o data-target-view da seta
        if (viewId === 'items-view') {
            DOM.backArrowButton.dataset.targetView = 'categories-view';
        } else if (viewId === 'admin-panel-view') {
            DOM.backArrowButton.dataset.targetView = 'categories-view'; // Ou 'items-view' se quiser voltar para o cardápio
        }
        // Se houver outras views que precisam de botão voltar, adicione aqui.
    }
}

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        // Opcional: Adicionar classe ao body para evitar scroll quando modal aberto
        // document.body.style.overflow = 'hidden';
        console.log(`DEBUG: Modal aberto: ${modalId}`); 
    }
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        // Opcional: Remover classe do body para permitir scroll
        // document.body.style.overflow = '';
        console.log(`DEBUG: Modal fechado: ${modalId}`); 
    }
}

export function showLoadingSpinner() {
    if (DOM.loadingOverlay) {
        DOM.loadingOverlay.style.display = 'flex';
        DOM.loadingOverlay.style.opacity = '1';
        DOM.loadingOverlay.style.visibility = 'visible';
        console.log("DEBUG: Spinner de carregamento mostrado.");
    }
}

export function hideLoadingSpinner() {
    if (DOM.loadingOverlay) {
        DOM.loadingOverlay.style.opacity = '0';
        DOM.loadingOverlay.style.visibility = 'hidden';
        setTimeout(() => {
            DOM.loadingOverlay.style.display = 'none';
        }, 300);
        console.log("DEBUG: Spinner de carregamento escondido.");
    }
}

// Funções para exibir mensagens de feedback (toast/banner)
export function showMessage(type, text, duration = 3000) {
    if (!DOM.feedbackMessagesContainer) { 
        console.error("ERRO: Contêiner de mensagens de feedback não encontrado!");
        return;
    }

    const messageElement = document.createElement('div');
    messageElement.className = `feedback-message ${type}`; 
    messageElement.textContent = text;

    DOM.feedbackMessagesContainer.appendChild(messageElement);

    void messageElement.offsetWidth; 
    messageElement.classList.add('show');

    setTimeout(() => {
        messageElement.classList.remove('show');
        messageElement.addEventListener('transitionend', () => {
            messageElement.remove();
        }, { once: true });
    }, duration);

    messageElement.addEventListener('click', () => {
        messageElement.classList.remove('show');
        messageElement.addEventListener('transitionend', () => {
            messageElement.remove();
        }, { once: true });
    });
    console.log(`DEBUG: Mensagem "${text}" (${type}) mostrada.`);
}

export function hideMessage(messageElement) {
    if (messageElement && messageElement.classList.contains('show')) {
        messageElement.classList.remove('show');
        messageElement.addEventListener('transitionend', () => {
            messageElement.remove();
        }, { once: true });
    }
}


// --- RENDERIZAÇÃO DO MENU ---

export function renderCategories(categories) {
    console.log("DEBUG: renderCategories chamado com dados:", categories); 
    DOM.categoriesContainer.innerHTML = '';
    if (!categories || categories.length === 0) {
        DOM.categoriesContainer.innerHTML = `<p class="info-message">Nenhuma categoria encontrada. Faça o login para gerenciar o catálogo.</p>`;
        console.log("DEBUG: Nenhuma categoria para renderizar ou array vazio."); 
        return;
    }

    categories.forEach(category => {
        console.log("DEBUG: Renderizando categoria:", category); 
        const card = document.createElement('div');
        card.className = 'category-card';
        card.dataset.categoryId = category.id; 
        card.dataset.categoryName = category.name; 
        card.innerHTML = `
            <img src="${category.image || 'images/placeholder-category.png'}" alt="${category.name}"> 
            <h3>${category.name}</h3>
        `;
        DOM.categoriesContainer.appendChild(card);
    });
    console.log("DEBUG: Renderização de categorias concluída. Total de cards adicionados:", categories.length); 
}

export function renderCategoryItemsCarousel(categoryName, items) {
    console.log(`DEBUG: renderCategoryItemsCarousel chamado para "${categoryName}" com ${items.length} itens.`); 
    DOM.itemsCategoryTitle.textContent = categoryName;
    DOM.itemsCarouselContainer.innerHTML = '';

    if (!items || items.length === 0) {
        DOM.itemsCarouselContainer.innerHTML = `<p>Não há itens nesta categoria.</p>`;
        console.log(`DEBUG: Nenhuns itens para renderizar para a categoria ${categoryName}.`); 
        return;
    }

    items.forEach(item => {
        console.log("DEBUG: Renderizando item de carrossel:", item); 
        const card = document.createElement('div');
        card.className = 'item-carousel-card';
        card.dataset.itemId = item.id; 

        const badgeHtml = item.badge ? `<div class="item-badge">${item.badge}</div>` : '';

        let priceHtml = '';
        const basePrice = Number(item.base_price); 
        const originalPrice = item.original_price ? Number(item.original_price) : 0;

        if (originalPrice > 0 && originalPrice > basePrice) {
            priceHtml = `
                <span class="price-original">De R$ ${originalPrice.toFixed(2)}</span>
                <span class="price-sale">Por R$ ${basePrice.toFixed(2)}</span>
            `;
        } else {
            priceHtml = `A partir de R$ ${basePrice.toFixed(2)}`;
        }

        card.innerHTML = `
            ${badgeHtml}
            <img src="${item.image || 'images/placeholder-item.png'}" alt="${item.name}"> 
            <h4>${item.name}</h4>
            <div class="price">${priceHtml}</div>
        `;
        DOM.itemsCarouselContainer.appendChild(card);
    });
    console.log(`DEBUG: Renderização de itens para "${categoryName}" concluída.`); 
}

let previouslySelectedCarouselCard = null; 

export function highlightSelectedCarouselItem(cardElement) {
    if (previouslySelectedCarouselCard) {
        previouslySelectedCarouselCard.classList.remove('selected');
    }
    if (cardElement) {
        cardElement.classList.add('selected');
    }
    previouslySelectedCarouselCard = cardElement;
}

export function hideInlineCustomizationPanel() {
    console.log("DEBUG: hideInlineCustomizationPanel chamado."); 
    DOM.inlineCustomizationPanel.classList.remove('active');
    setTimeout(() => {
        if (!DOM.inlineCustomizationPanel.classList.contains('active')) {
            DOM.inlineCustomizationPanel.classList.add('inline-customization-panel-hidden');
        }
    }, 400);
    highlightSelectedCarouselItem(null);
}

export function showInlineCustomizationPanel(item) {
    console.log("DEBUG: showInlineCustomizationPanel chamado com item:", item); 
    DOM.inlineCustomItemName.textContent = item.name;
    DOM.inlineCustomItemImage.src = item.image || 'images/placeholder-item.png'; 
    DOM.inlineCustomItemBasePrice.textContent = Number(item.base_price).toFixed(2);
    
    renderDefaultIngredients(item.default_ingredients || []);
    renderCustomizableOptions(item.customizable_options || []);
    
    updateInlineCustomizationDetailsDisplay(); 

    DOM.inlineCustomizationPanel.classList.remove('inline-customization-panel-hidden');
    DOM.inlineCustomizationPanel.classList.add('active');
}

function renderDefaultIngredients(ingredients) {
    console.log("DEBUG: renderDefaultIngredients chamado com:", ingredients); 
    DOM.inlineDefaultIngredientsList.innerHTML = '<h4>Ingredientes Padrão:</h4>';
    if (!ingredients || ingredients.length === 0) {
        DOM.inlineDefaultIngredientsList.innerHTML += '<p>Nenhum.</p>';
        return;
    }
    ingredients.forEach(di => {
        const row = document.createElement('div');
        row.className = 'option-row-inline';
        const buttonText = di.included ? 'Manter' : 'Remover';
        const buttonClass = di.included ? 'active' : 'inactive';
        const buttonHtml = di.removable 
            ? `<button class="toggle-ingredient-control ${buttonClass}" data-di-id="${di.id_name}">${buttonText}</button>`
            : '<span>(Fixo)</span>';

        row.innerHTML = `
            <span class="option-name-inline">${di.name}</span>
            <div class="toggle-ingredient-control">
                ${buttonHtml}
            </div>
        `;
        DOM.inlineDefaultIngredientsList.appendChild(row);
    });
}

function renderCustomizableOptions(options) {
    console.log("DEBUG: renderCustomizableOptions chamado com:", options); 
    DOM.inlineCustomizableOptionsList.innerHTML = '<h4>Adicione ou Modifique:</h4>';
     if (!options || options.length === 0) {
        DOM.inlineCustomizableOptionsList.innerHTML += '<p>Nenhuma opção extra disponível.</p>';
        return;
    }

    const groupedOptions = options.reduce((acc, opt) => {
        const key = opt.option_type === 'variant' ? opt.variant_group : opt.id_name; 
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(opt);
        return acc;
    }, {});

    for (const key in groupedOptions) {
        const group = groupedOptions[key];
        const firstOption = group[0];
        
        if (firstOption.option_type === 'add') {
            const row = document.createElement('div');
            row.className = 'option-row-inline';
            row.innerHTML = `
                <span class="option-name-inline">${firstOption.name}</span>
                <span class="option-price-inline">+ R$ ${Number(firstOption.price_change).toFixed(2)}</span>
                <div class="quantity-control">
                    <button class="inline-decrease-co-qty" data-co-id="${firstOption.id_name}">-</button> 
                    <span class="option-quantity-inline" data-co-id-display="${firstOption.id_name}">0</span> 
                    <button class="inline-increase-co-qty" data-co-id="${firstOption.id_name}">+</button> 
                </div>
            `;
            DOM.inlineCustomizableOptionsList.appendChild(row);
        } else if (firstOption.option_type === 'variant') {
            const row = document.createElement('div');
            row.className = 'option-row-inline variant-row';
            const groupTitle = firstOption.variant_group.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            row.innerHTML = `
                <span class="option-name-inline" style="flex-grow: 1; font-weight: bold; margin-bottom: 5px;">${groupTitle}:</span>
                <div class="variant-control">
                    ${group.map(opt => 
                        `<button class="variant-button" data-co-id="${opt.id_name}" data-variant-group="${opt.variant_group}">
                            ${opt.name} ${opt.price_change > 0 ? `(+R$ ${Number(opt.price_change).toFixed(2)})` : ''}
                        </button>`
                    ).join('')}
                </div>
            `;
            DOM.inlineCustomizableOptionsList.appendChild(row);
        }
    }
}

export function updateInlineCustomizationDetailsDisplay() {
    console.log("DEBUG: updateInlineCustomizationDetailsDisplay chamado."); 
    const item = Menu.getCurrentItemBeingCustomized();
    const state = Menu.currentCustomizationState;
    if (!item || !state) {
        console.warn("AVISO: Item ou estado de customização ausente para updateInlineCustomizationDetailsDisplay."); 
        return;
    }

    // Lógica para toggle de ingredientes padrão
    document.querySelectorAll('#inline-default-ingredients-list .toggle-ingredient-control').forEach(btn => { 
        const diId = btn.dataset.diId;
        const diConfig = item.default_ingredients.find(di => di.id_name === diId);
        
        if (diConfig) { 
            if (diConfig.removable === undefined || diConfig.removable === true) {
                const isIncluded = state.defaultIngredients[diId]; 
                btn.textContent = isIncluded ? 'Manter' : 'Remover';
                btn.classList.toggle('active', isIncluded);
                btn.classList.toggle('inactive', !isIncluded);
                btn.disabled = false; 
                console.log(`DEBUG: DI ${diId} - Estado de botão atualizado: ${isIncluded ? 'Manter' : 'Remover'}`); 
            } else {
                btn.textContent = '(Fixo)'; 
                btn.classList.remove('active', 'inactive');
                btn.disabled = true; 
                console.log(`DEBUG: DI ${diId} - Ingrediente fixo, botão desabilitado.`); 
            }
        } else {
            console.warn(`AVISO: Configuração de ingrediente padrão não encontrada para ${diId}.`);
            btn.disabled = true; 
        }
    });

    // Lógica para quantidade de opções customizáveis (adicionais)
    document.querySelectorAll('#inline-customizable-options-list .quantity-control').forEach(control => { 
        const increaseButton = control.querySelector('.inline-increase-co-qty');
        const coId = increaseButton?.dataset.coId;
        if (coId) {
            const qty = state.customizableOptions[coId] || 0;
            const config = item.customizable_options.find(opt => opt.id_name === coId && opt.option_type === 'add'); 
            if (config) {
                control.querySelector('.option-quantity-inline').textContent = qty;
                control.querySelector('.inline-decrease-co-qty').disabled = qty <= config.min_quantity;
                increaseButton.disabled = qty >= config.max_quantity;
                console.log(`DEBUG: CO ${coId} (Add) - Qty=${qty}, Min=${config.min_quantity}, Max=${config.max_quantity}`); 
            } else {
                console.warn(`AVISO: Configuração de opção customizável "add" não encontrada ou tipo incorreto para ${coId}`); 
                control.querySelector('.inline-decrease-co-qty').disabled = true;
                increaseButton.disabled = true;
            }
        }
    });
    
    // Lógica para seleção de variantes
    document.querySelectorAll('#inline-customizable-options-list .variant-control').forEach(control => { 
        const variantButtonsInGroup = control.querySelectorAll('.variant-button');
        if (variantButtonsInGroup.length > 0) {
            const variantGroup = variantButtonsInGroup[0].dataset.variantGroup;
            const selectedId = state.customizableOptions[variantGroup]; 
            
            variantButtonsInGroup.forEach(btn => {
                const isSelected = btn.dataset.coId === selectedId;
                btn.classList.toggle('selected', isSelected);
                btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
                console.log(`DEBUG: Variante ${btn.dataset.coId} - Selecionado: ${isSelected}`); 
            });
            console.log(`DEBUG: Grupo de variante "${variantGroup}" - Selecionado: ${selectedId}`); 
        }
    });

    DOM.inlineItemQuantityInput.value = state.overallQuantity;

    const unitPrice = Menu.calculateUnitPrice();
    const totalPrice = unitPrice * state.overallQuantity;
    DOM.inlineCustomItemUnitPriceDisplay.textContent = unitPrice.toFixed(2);
    DOM.inlineCustomItemTotalPriceDisplay.textContent = totalPrice.toFixed(2);
    console.log(`DEBUG: Preço unitário: ${unitPrice.toFixed(2)}, Preço total: ${totalPrice.toFixed(2)}`); 
}

// --- CARRINHO DE COMPRAS ---

export function updateCartSummary() {
    DOM.cartCountSummary.textContent = Cart.getCartTotalItems();
    DOM.cartTotalSummary.textContent = Cart.getCartGrandTotal().toFixed(2);
}

export function renderCartDetailed() {
    console.log("DEBUG: renderCartDetailed chamado."); 
    const cartData = Cart.getCart();
    DOM.cartItemsDetailedContainer.innerHTML = '';

    if (cartData.length === 0) {
        DOM.cartItemsDetailedContainer.innerHTML = '<p>Seu carrinho está vazio.</p>';
        console.log("DEBUG: Carrinho vazio para renderizar."); 
    } else {
        cartData.forEach(item => {
            console.log("DEBUG: Renderizando item do carrinho:", item); 
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item-detailed';
            
            let customText = '';
            if (item.customizations) {
                const details = [];
                if (item.customizations.selectedVariants?.length > 0) details.push(item.customizations.selectedVariants.map(v => v.name).join(', '));
                if (item.customizations.addedExtras?.length > 0) details.push(item.customizations.addedExtras.map(e => e.quantity > 1 ? `${e.quantity}x ${e.name}`: e.name).join(', '));
                if (item.customizations.removedDefaults?.length > 0) details.push(`Sem: ${item.customizations.removedDefaults.join(', ')}`);
                customText = `<span class="customizations">${details.join('; ')}</span>`;
            }
            
            itemDiv.innerHTML = `
                <div class="cart-item-info">
                    <strong>${item.name}</strong>
                    ${customText}
                    <p>Total: R$ ${item.totalPrice.toFixed(2)}</p>
                </div>
                <div class="cart-item-actions">
                    <button class="cart-decrease-qty" data-cart-item-id="${item.cartItemId}">-</button>
                    <span class="cart-item-quantity-display">${item.quantity}</span>
                    <button class="cart-increase-qty" data-cart-item-id="${item.cartItemId}">+</button>
                    <button class="cart-remove-item" data-cart-item-id="${item.cartItemId}">Remover</button>
                </div>
            `;
            DOM.cartItemsDetailedContainer.appendChild(itemDiv);
        });
        console.log("DEBUG: Renderização detalhada do carrinho concluída."); 
    }
    DOM.totalPriceDetailed.textContent = Cart.getCartGrandTotal().toFixed(2);
}

export function openCartModal() {
    renderCartDetailed();
    openModal('cart-modal');
}