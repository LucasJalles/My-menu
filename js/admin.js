// Menu/js/admin.js - Versão com upload de imagens e spinners
import * as DOM from './domElements.js';
import * as Menu from './menu.js';
import * as Auth from './auth.js';
import { getRestaurantSlugFromUrl } from './config.js';
import * as UIRenderer from './uiRenderer.js';

const restaurantSlug = getRestaurantSlugFromUrl();
let allCategories = [];
let allItems = [];

// --- FUNÇÃO HELPER PARA GERAR SLUGS ---
function slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

// --- Funções Auxiliares de Modal ---
function closeCategoryModal() {
    console.log("DEBUG: closeCategoryModal chamado.");
    const modal = document.getElementById('category-modal');
    if (modal) {
        modal.remove(); // Remove o modal do DOM
        // Certifique-se de que o scroll está reativado se houver um body overflow hidden
        document.body.style.overflow = '';
    }
}

function closeItemModal() {
    console.log("DEBUG: closeItemModal chamado.");
    const modal = document.getElementById('item-modal');
    if (modal) {
        modal.remove(); // Remove o modal do DOM
        // Certifique-se de que o scroll está reativado se houver um body overflow hidden
        document.body.style.overflow = '';
    }
}

// Adiciona um ouvinte para o evento 'submit' que limpa a mensagem de erro
function setupFormErrorDisplay(formId, modalErrorElementId) {
    const form = document.getElementById(formId);
    const modalError = document.getElementById(modalErrorElementId);
    if (form && modalError) {
        form.addEventListener('submit', () => {
            modalError.textContent = '';
            modalError.classList.remove('error-message'); // Garante que a classe de erro seja removida
        });
    }
}
// FIM das Funções Auxiliares de Modal


// --- INICIALIZAÇÃO E CONTROLE DE ABAS ---

export async function initializeAdminPanel() {
    console.log("DEBUG: initializeAdminPanel chamado.");

    try {
        console.log("DEBUG: Chamando Menu.fetchCategories()...");
        const categoriesResult = await Menu.fetchCategories();
        console.log("DEBUG: Resultado de Menu.fetchCategories():", categoriesResult);

        if (Array.isArray(categoriesResult)) {
            allCategories = categoriesResult;
            console.log("DEBUG: allCategories atribuído com sucesso:", allCategories);
        } else {
            console.error("DEBUG: fetchCategories não retornou um array:", categoriesResult);
            allCategories = [];
        }

        console.log("DEBUG: Chamando Menu.fetchItems() para todos os itens no initializeAdminPanel...");
        const itemsResult = await Menu.fetchItems(null, true);
        if (Array.isArray(itemsResult)) {
            allItems = itemsResult;
            console.log("DEBUG: allItems atribuído com sucesso:", allItems);
        } else {
            console.error("DEBUG: fetchItems não retornou um array:", itemsResult);
            allItems = [];
        }

    } catch (error) {
        console.error("DEBUG: Erro ao chamar Menu.fetchCategories() ou Menu.fetchItems():", error);
        allCategories = [];
        allItems = [];
        UIRenderer.showMessage('error', 'Erro ao carregar dados do painel de administração.');
    }

    console.log("DEBUG: allCategories após fetchCategories:", allCategories);
    console.log("DEBUG: allItems após fetchItems:", allItems);

    switchAdminTab('manage-categories');

    // Mover a anexação de listeners para dentro de initializeEventListeners em main.js
    // para evitar anexação múltipla se initializeAdminPanel for chamado mais de uma vez
    // Mas para este arquivo, manter aqui para demonstração se for standalone.
    // O ideal seria que initializeEventListeners chamasse um setupAdminPanelListeners
    // que anexe os listeners uma única vez.
    if (!DOM.categoriesAdminList.dataset.listenersAttached) {
        addAdminListListeners();
    }
}

function addAdminListListeners() {
    const handleAdminListClick = (event) => {
        const target = event.target;
        if (!target.matches('button')) return;

        const row = target.closest('.admin-list-row');
        if (!row) return;

        if (row.dataset.categoryId) {
            const categoryId = row.dataset.categoryId;
            if (target.matches('.edit-btn')) {
                console.log("DEBUG: Clicou em Editar Categoria:", categoryId);
                handleEditCategory(categoryId);
            } else if (target.matches('.delete-btn')) {
                const categoryName = row.querySelector('span').textContent;
                console.log("DEBUG: Clicou em Excluir Categoria:", categoryId, categoryName);
                handleDeleteCategory(categoryId, categoryName);
            }
        } else if (row.dataset.itemId) {
            const itemId = row.dataset.itemId;
            if (target.matches('.edit-btn')) {
                console.log("DEBUG: Clicou em Editar Item:", itemId);
                handleEditItem(itemId);
            } else if (target.matches('.delete-btn')) {
                const itemName = row.querySelector('strong').textContent;
                console.log("DEBUG: Clicou em Excluir Item:", itemId, itemName);
                handleDeleteItem(itemId, itemName);
            }
        }
    };

    if (!DOM.categoriesAdminList.dataset.listenersAttached) {
        DOM.categoriesAdminList.addEventListener('click', handleAdminListClick);
        DOM.categoriesAdminList.dataset.listenersAttached = 'true';
        console.log("DEBUG: Listener de categorias admin anexado.");
    }

    if (!DOM.itemsAdminList.dataset.listenersAttached) {
        DOM.itemsAdminList.addEventListener('click', handleAdminListClick);
        DOM.itemsAdminList.dataset.listenersAttached = 'true';
        console.log("DEBUG: Listener de itens admin anexado.");
    }
}


export function switchAdminTab(targetTabId) {
    console.log("DEBUG: switchAdminTab chamado para:", targetTabId);
    DOM.adminTabContents.forEach(content => content.classList.remove('active-tab-content'));
    const targetContent = document.getElementById(targetTabId);
    if (targetContent) targetContent.classList.add('active-tab-content');

    DOM.adminTabButtons.forEach(button => button.classList.remove('active-tab'));
    const targetButton = document.querySelector(`.admin-tab-button[data-target-tab="${targetTabId}"]`);
    if (targetButton) targetButton.classList.add('active-tab');

    if (targetTabId === 'manage-categories') {
        loadCategoriesForAdmin();
    } else if (targetTabId === 'manage-items') {
        loadItemsForAdmin();
    }
}

// --- RENDERIZAÇÃO DAS LISTAS ---

async function loadCategoriesForAdmin() {
    console.log("DEBUG: loadCategoriesForAdmin chamado.");
    DOM.categoriesAdminList.innerHTML = '<p>Carregando categorias...</p>';

    if (!allCategories || !Array.isArray(allCategories) || allCategories.length === 0) {
        console.log("DEBUG: allCategories vazio ou inválido, tentando recarregar via Menu.fetchCategories.");
        try {
            allCategories = await Menu.fetchCategories();
            console.log("DEBUG: Categorias recarregadas em loadCategoriesForAdmin:", allCategories);
        } catch (error) {
            console.error("DEBUG: Erro ao recarregar categorias em loadCategoriesForAdmin:", error);
            UIRenderer.showMessage('error', 'Erro ao carregar categorias. Verifique a conexão ou tente novamente.');
            DOM.categoriesAdminList.innerHTML = '<p class="error-message">Erro ao carregar categorias. Verifique a conexão ou tente novamente.</p>';
            return;
        }
    }

    DOM.categoriesAdminList.innerHTML = '';

    if (!allCategories || allCategories.length === 0) {
        DOM.categoriesAdminList.innerHTML = `<p class="info-message">Você ainda não tem categorias cadastradas. Clique em "+ Adicionar Nova Categoria" para começar.</p>`;
        return;
    }

    allCategories.forEach(category => {
        const row = createAdminListRow('category', category);
        DOM.categoriesAdminList.appendChild(row);
    });
    console.log("DEBUG: Categorias renderizadas no painel admin.");
}

async function loadItemsForAdmin() {
    console.log("DEBUG: loadItemsForAdmin chamado.");
    DOM.itemsAdminList.innerHTML = '<p>Carregando itens...</p>';
    try {
        allItems = await Menu.fetchItems(null, true);
        console.log("DEBUG: allItems recarregado em loadItemsForAdmin para renderização:", allItems);

        DOM.itemsAdminList.innerHTML = '';
        if (allItems.length === 0) {
            DOM.itemsAdminList.innerHTML = `<p class="info-message">Você ainda não tem itens cadastrados. Clique em "+ Adicionar Novo Item" para começar.</p>`;
            return;
        }
        allItems.forEach(item => {
            const row = createAdminListRow('item', item);
            DOM.itemsAdminList.appendChild(row);
        });
        console.log("DEBUG: Itens renderizados no painel admin.");
    } catch (error) {
        console.error("Erro ao carregar itens:", error);
        UIRenderer.showMessage('error', 'Erro ao carregar itens.');
        DOM.itemsAdminList.innerHTML = '<p class="error-message">Erro ao carregar itens.</p>';
    }
}

function createAdminListRow(type, data) {
    const row = document.createElement('div');
    row.className = 'admin-list-row';

    if (type === 'category') {
        row.dataset.categoryId = data.id;
        const imageUrl = data.image ? data.image : 'images/placeholder-category.png';
        row.innerHTML = `
            <img src="${imageUrl}" class="admin-list-image" alt="${data.name}">
            <span>${data.name}</span>
            <div class="actions">
                <button class="edit-btn">Editar</button>
                <button class="delete-btn danger-button">Excluir</button>
            </div>`;
    } else if (type === 'item') {
        row.dataset.itemId = data.id;
        // Encontra a categoria pelo db_id que é o ID interno do Django
        const categoryName = allCategories.find(c => c.db_id === data.category)?.name || 'Sem categoria';
        const imageUrl = data.image ? data.image : 'images/placeholder-item.png';
        row.innerHTML = `
            <img src="${imageUrl}" class="admin-list-image" alt="${data.name}">
            <div class="item-info">
                <strong>${data.name}</strong>
                <span>${categoryName} - R$ ${Number(data.base_price).toFixed(2)}</span>
            </div>
            <div class="actions">
                <button class="edit-btn">Editar</button>
                <button class="delete-btn danger-button">Excluir</button>
            </div>`;
    }
    return row;
}

// --- HANDLERS (Funções de CRUD) ---

export function handleAddCategory() {
    console.log("DEBUG: handleAddCategory chamado.");
    showCategoryModal({
        title: 'Adicionar Nova Categoria',
        onSave: async (formData) => {
            console.log("DEBUG: Dados da categoria antes do envio (criação):", formData);
            try {
                const response = await Menu.categoriesAPI.create(formData);
                if (response) {
                    console.log("DEBUG: Categoria criada com sucesso:", response);
                    closeCategoryModal();
                    allCategories = await Menu.fetchCategories();
                    await loadCategoriesForAdmin();
                    UIRenderer.showMessage('success', `Categoria "${response.name}" criada com sucesso!`);
                }
            } catch (error) {
                console.error("ERRO: Falha ao criar categoria:", error);
                UIRenderer.showMessage('error', `Falha ao criar categoria: ${error.message || 'Erro desconhecido.'}`);
            }
        }
    });
}

async function handleEditCategory(categoryId) {
    console.log("DEBUG: handleEditCategory chamado para:", categoryId);
    const category = allCategories.find(cat => cat.id === categoryId);
    if (!category) {
        UIRenderer.showMessage('error', 'Erro ao carregar dados da categoria para edição.');
        console.error("Categoria não encontrada na lista local para edição:", categoryId);
        return;
    }
    showCategoryModal({
        title: 'Editar Categoria',
        category: category,
        onSave: async (formData) => {
            console.log("DEBUG: Dados da categoria antes do envio (edição):", formData);
            try {
                const response = await Menu.categoriesAPI.update(categoryId, formData);
                if (response) {
                    console.log("DEBUG: Categoria editada com sucesso:", response);
                    closeCategoryModal();
                    allCategories = await Menu.fetchCategories();
                    await loadCategoriesForAdmin();
                    UIRenderer.showMessage('success', `Categoria "${response.name}" atualizada com sucesso!`);
                }
            } catch (error) {
                console.error("ERRO: Falha ao editar categoria:", error);
                UIRenderer.showMessage('error', `Falha ao editar categoria: ${error.message || 'Erro desconhecido.'}`);
            }
        }
    });
}

async function handleDeleteCategory(categoryId, categoryName) {
    console.log("DEBUG: handleDeleteCategory chamado para:", categoryId, categoryName);
    if (!confirm(`Tem certeza que deseja excluir a categoria "${categoryName}"? Todos os itens dela também serão removidos!`)) {
        return;
    }
    try {
        const success = await Menu.categoriesAPI.delete(categoryId);
        if (success) {
            console.log("DEBUG: Categoria excluída com sucesso:", categoryId);
            allCategories = await Menu.fetchCategories();
            await loadCategoriesForAdmin();
            UIRenderer.showMessage('success', `Categoria "${categoryName}" excluída com sucesso!`);
        }
    } catch (error) {
        console.error("ERRO: Falha ao excluir categoria:", error);
        UIRenderer.showMessage('error', `Falha ao excluir categoria: ${error.message || 'Erro desconhecido.'}`);
    }
}

export function handleAddItem() {
    console.log("DEBUG: handleAddItem chamado.");
    showItemModal({
        title: 'Adicionar Novo Item',
        onSave: async (itemData) => {
            console.log("DEBUG: Dados do item antes do envio (criação):", itemData);
            try {
                const response = await Menu.itemsAPI.create(itemData);
                if (response) {
                    console.log("DEBUG: Item criado com sucesso:", response);
                    closeItemModal();
                    allItems = await Menu.fetchItems(null, true);
                    await loadItemsForAdmin();
                    UIRenderer.showMessage('success', `Item "${response.name}" criado com sucesso!`);
                }
            } catch (error) {
                console.error("ERRO: Falha ao criar item:", error);
                UIRenderer.showMessage('error', `Falha ao criar item: ${error.message || 'Erro desconhecido.'}`);
            }
        }
    });
}

async function handleEditItem(itemId) {
    console.log("DEBUG: handleEditItem chamado para:", itemId);
    const item = allItems.find(it => it.id === itemId);
    if (!item) {
        UIRenderer.showMessage('error', 'Erro ao carregar dados do item.');
        console.error("Item não encontrado na lista local:", itemId);
        return;
    }
    showItemModal({
        title: 'Editar Item',
        item: item,
        onSave: async (itemData) => {
            console.log("DEBUG: Dados do item antes do envio (edição):", itemData);
            try {
                const response = await Menu.itemsAPI.update(itemId, itemData);
                if (response) {
                    console.log("DEBUG: Item editado com sucesso:", response);
                    closeItemModal();
                    allItems = await Menu.fetchItems(null, true);
                    await loadItemsForAdmin();
                    UIRenderer.showMessage('success', `Item "${response.name}" atualizado com sucesso!`);
                }
            } catch (error) {
                console.error("ERRO: Falha ao editar item:", error);
                UIRenderer.showMessage('error', `Falha ao editar item: ${error.message || 'Erro desconhecido.'}`);
            }
        }
    });
}

async function handleDeleteItem(itemId, itemName) {
    console.log("DEBUG: handleDeleteItem chamado para:", itemId, itemName);
    if (!confirm(`Tem certeza que deseja excluir o item "${itemName}"?`)) {
        return;
    }
    try {
        const success = await Menu.itemsAPI.delete(itemId);
        if (success) {
            console.log("DEBUG: Item excluído com sucesso:", itemId);
            allItems = await Menu.fetchItems(null, true);
            await loadItemsForAdmin();
            UIRenderer.showMessage('success', `Item "${itemName}" excluído com sucesso!`);
        }
    } catch (error) {
        console.error("ERRO: Falha ao excluir item:", error);
        UIRenderer.showMessage('error', `Falha ao excluir item: ${error.message || 'Erro desconhecido.'}`);
    }
}

// --- MODAIS (HTML DINÂMICO PARA FORMULÁRIOS) ---

function showCategoryModal({ title, category = {}, onSave }) {
    console.log("DEBUG: showCategoryModal chamado com categoria:", category);
    closeCategoryModal();
    const isEditing = !!category.id;
    const currentImageUrl = category.image ? category.image : 'images/placeholder-category.png';

    const modalHtml = `
        <div id="category-modal" class="modal" style="display: block;">
            <div class="modal-content">
                <span class="close-button" data-modal-id="category-modal" aria-label="Fechar">&times;</span>
                <h2>${title}</h2>
                <form id="category-form" enctype="multipart/form-data">
                    <div class="form-group">
                        <label for="category-name">Nome da Categoria:</label>
                        <input type="text" id="category-name" name="name" value="${category.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="category-id-name">ID Único (gerado, ex: burgers):</label>
                        <input type="text" id="category-id-name" name="id_name" value="${category.id_name || slugify(category.name || '')}" ${isEditing ? 'readonly' : ''} required>
                        ${isEditing ? '<small style="color: #7f8c8d;">(Não editável após a criação)</small>' : ''}
                    </div>
                    <div class="form-group">
                        <label for="category-image">Imagem da Categoria:</label>
                        <input type="file" id="category-image" name="image" accept="image/*">
                        ${isEditing && currentImageUrl ? `<img src="${currentImageUrl}" alt="Imagem atual" class="admin-form-image-preview">` : ''}
                    </div>
                    <button type="submit" class="success-button">Salvar</button>
                    <p id="modal-error-message" class="error-message"></p>
                </form>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('category-modal');
    modal.querySelector('.close-button').addEventListener('click', closeCategoryModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeCategoryModal();
    });

    const categoryNameInput = modal.querySelector('#category-name');
    const categoryIdNameInput = modal.querySelector('#category-id-name');

    if (!isEditing) {
        categoryNameInput.addEventListener('input', () => {
            categoryIdNameInput.value = slugify(categoryNameInput.value);
        });
    }

    modal.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorMessageElement = modal.querySelector('#modal-error-message');
        errorMessageElement.textContent = ''; // Limpa mensagens de erro anteriores
        errorMessageElement.classList.remove('error-message');

        const name = categoryNameInput.value.trim();
        const id_name = categoryIdNameInput.value.trim();

        if (!name) {
            errorMessageElement.textContent = 'O nome da categoria é obrigatório.';
            errorMessageElement.classList.add('error-message');
            UIRenderer.showMessage('error', 'O nome da categoria é obrigatório.');
            return;
        }
        if (!id_name) {
            errorMessageElement.textContent = 'O ID único da categoria é obrigatório.';
            errorMessageElement.classList.add('error-message');
            UIRenderer.showMessage('error', 'O ID único da categoria é obrigatório.');
            return;
        }

        const formData = new FormData(e.target);

        // Estes campos são para o backend, o frontend não os gerencia diretamente no formulário de categoria
        const defaultIngredients = [];
        const customizableOptions = [];

        formData.append('default_ingredients', JSON.stringify(defaultIngredients));
        formData.append('customizable_options', JSON.stringify(customizableOptions));

        await onSave(formData);
    });

    setupFormErrorDisplay('category-form', 'modal-error-message');
}

// Funções para adicionar/remover linhas de ingredientes e opções
function addIngredientRow(container, ingredient = {}) {
    const row = document.createElement('div');
    row.className = 'ingredient-row form-group';
    row.innerHTML = `
        <label>Nome:</label>
        <input type="text" name="default_ingredient_name" value="${ingredient.name || ''}" placeholder="Ex: Alface" required>
        <label>ID Único:</label>
        <input type="text" name="default_ingredient_id_name" value="${ingredient.id_name || slugify(ingredient.name || '')}" placeholder="Ex: alface" ${ingredient.id_name ? 'readonly' : ''} required>
        <label>Incluído por padrão:</label>
        <input type="checkbox" name="default_ingredient_included" ${ingredient.included !== false ? 'checked' : ''}>
        <label>Removível:</label>
        <input type="checkbox" name="default_ingredient_removable" ${ingredient.removable !== false ? 'checked' : ''}>
        <button type="button" class="remove-row-btn danger-button">Remover</button>
    `;
    container.appendChild(row);

    const nameInput = row.querySelector('[name="default_ingredient_name"]');
    const idNameInput = row.querySelector('[name="default_ingredient_id_name"]');
    if (!ingredient.id_name) {
        nameInput.addEventListener('input', () => {
            idNameInput.value = slugify(nameInput.value);
        });
    }

    row.querySelector('.remove-row-btn').addEventListener('click', () => row.remove());
}

function addOptionRow(container, option = {}) {
    const row = document.createElement('div');
    row.className = 'option-row form-group';
    row.innerHTML = `
        <label>Nome da Opção:</label>
        <input type="text" name="option_name" value="${option.name || ''}" placeholder="Ex: Bacon Extra" required>
        <label>ID Único da Opção:</label>
        <input type="text" name="option_id_name" value="${option.id_name || slugify(option.name || '')}" placeholder="Ex: bacon_extra" ${option.id_name ? 'readonly' : ''} required>
        <label>Tipo:</label>
        <select name="option_type" required>
            <option value="add" ${option.option_type === 'add' ? 'selected' : ''}>Adicional</option>
            <option value="variant" ${option.option_type === 'variant' ? 'selected' : ''}>Variante</option>
        </select>
        <label>Mudança de Preço (R$):</label>
        <input type="number" step="0.01" name="price_change" value="${option.price_change || 0}" required>

        <div class="add-option-fields" style="display: ${option.option_type === 'add' ? 'block' : 'none'};">
            <label>Qtd Mínima:</label>
            <input type="number" name="min_quantity" value="${option.min_quantity || 0}">
            <label>Qtd Máxima:</label>
            <input type="number" name="max_quantity" value="${option.max_quantity || 1}">
            <label>Qtd Padrão:</label>
            <input type="number" name="default_quantity" value="${option.default_quantity || 0}">
        </div>

        <div class="variant-option-fields" style="display: ${option.option_type === 'variant' ? 'block' : 'none'};">
            <label>Grupo de Variante (Ex: Sabor, Tamanho):</label>
            <input type="text" name="variant_group" value="${option.variant_group || ''}" placeholder="Ex: sabor_refri">
            <label>Selecionado por Padrão:</label>
            <input type="checkbox" name="default_selected" ${option.default_selected ? 'checked' : ''}>
        </div>
        <button type="button" class="remove-row-btn danger-button">Remover</button>
    `;
    container.appendChild(row);

    const typeSelect = row.querySelector('[name="option_type"]');
    const addFields = row.querySelector('.add-option-fields');
    const variantFields = row.querySelector('.variant-option-fields');
    const nameInput = row.querySelector('[name="option_name"]');
    const idNameInput = row.querySelector('[name="option_id_name"]');

    if (!option.id_name) {
        nameInput.addEventListener('input', () => {
            idNameInput.value = slugify(nameInput.value);
        });
    }

    typeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'add') {
            addFields.style.display = 'block';
            variantFields.style.display = 'none';
        } else {
            addFields.style.display = 'none';
            variantFields.style.display = 'block';
        }
    });

    row.querySelector('.remove-row-btn').addEventListener('click', () => row.remove());
}


function showItemModal({ title, item = {}, onSave }) {
    console.log("DEBUG: showItemModal chamado com item:", item);
    closeItemModal();
    const isEditing = !!item.id;
    const currentImageUrl = item.image ? item.image : 'images/placeholder-item.png';

    if (!allCategories || allCategories.length === 0) {
        UIRenderer.showMessage('info', 'Nenhuma categoria encontrada. Por favor, adicione categorias antes de criar itens.');
        return;
    }

    // Usar item.category (que é o db_id) para pré-selecionar
    const selectedCategoryIdNum = item.category || (allCategories.length > 0 ? allCategories[0].db_id : null);

    const categoryOptions = allCategories.map(c =>
        `<option value="${c.db_id}" ${selectedCategoryIdNum === c.db_id ? 'selected' : ''}>${c.name}</option>`
    ).join('');

    const modalHtml = `
        <div id="item-modal" class="modal" style="display: block;">
            <div class="modal-content">
                <span class="close-button" data-modal-id="item-modal" aria-label="Fechar">&times;</span>
                <h2>${title}</h2>
                <form id="item-form" enctype="multipart/form-data">
                    <div class="form-group">
                        <label for="item-name">Nome do Item:</label>
                        <input type="text" id="item-name" name="name" value="${item.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="item-id-name">ID Único (gerado, ex: big-mac):</label>
                        <input type="text" id="item-id-name" name="id_name" value="${item.id_name || slugify(item.name || '')}" ${isEditing ? 'readonly' : ''} required>
                        ${isEditing ? '<small style="color: #7f8c8d;">(Não editável após a criação)</small>' : ''}
                    </div>
                    <div class="form-group">
                        <label for="item-description">Descrição:</label>
                        <textarea id="item-description" name="description" required>${item.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="item-base-price">Preço Base (R$):</label>
                        <input type="number" step="0.01" id="item-base-price" name="base_price" value="${item.base_price || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="item-original-price">Preço Original (R$, para oferta):</label>
                        <input type="number" step="0.01" id="item-original-price" name="original_price" value="${item.original_price || ''}">
                    </div>
                    <div class="form-group">
                        <label for="item-badge">Badge (ex: Mais Vendido, Oferta!):</label>
                        <input type="text" id="item-badge" name="badge" value="${item.badge || ''}">
                    </div>
                    <div class="form-group">
                        <label for="item-image">Imagem do Item:</label>
                        <input type="file" id="item-image" name="image" accept="image/*">
                        ${isEditing && currentImageUrl ? `<img src="${currentImageUrl}" alt="Imagem atual" class="admin-form-image-preview">` : ''}
                    </div>
                    <div class="form-group">
                        <label for="item-category">Categoria:</label>
                        <select id="item-category" name="category" required>${categoryOptions}</select>
                    </div>

                    <h3>Ingredientes Padrão</h3>
                    <div id="default-ingredients-container"></div>
                    <button type="button" class="add-ingredient-btn success-button">Adicionar Ingrediente</button>

                    <h3>Opções Customizáveis</h3>
                    <div id="customizable-options-container"></div>
                    <button type="button" class="add-option-btn success-button">Adicionar Opção</button>

                    <button type="submit" class="success-button" style="margin-top: 1.5rem;">Salvar Item</button>
                    <p id="item-modal-error-message" class="error-message"></p>
                </form>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('item-modal');
    modal.querySelector('.close-button').addEventListener('click', closeItemModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeItemModal();
    });

    const itemNameInput = modal.querySelector('#item-name');
    const itemIdNameInput = modal.querySelector('#item-id-name');
    const itemDescriptionInput = modal.querySelector('#item-description');
    const itemBasePriceInput = modal.querySelector('#item-base-price');
    const itemOriginalPriceInput = modal.querySelector('#item-original-price');
    const itemCategorySelect = modal.querySelector('#item-category');
    const itemModalErrorMessage = modal.querySelector('#item-modal-error-message');


    if (!isEditing) {
        itemNameInput.addEventListener('input', () => {
            itemIdNameInput.value = slugify(itemNameInput.value);
        });
    }

    modal.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        itemModalErrorMessage.textContent = ''; // Limpa mensagens de erro anteriores
        itemModalErrorMessage.classList.remove('error-message');

        // Validação dos campos principais do item
        const name = itemNameInput.value.trim();
        const id_name = itemIdNameInput.value.trim();
        const description = itemDescriptionInput.value.trim();
        const basePrice = parseFloat(itemBasePriceInput.value);
        const originalPrice = itemOriginalPriceInput.value ? parseFloat(itemOriginalPriceInput.value) : 0;
        const categoryId = itemCategorySelect.value;

        if (!name) {
            itemModalErrorMessage.textContent = 'O nome do item é obrigatório.';
            itemModalErrorMessage.classList.add('error-message');
            UIRenderer.showMessage('error', 'O nome do item é obrigatório.');
            return;
        }
        if (!id_name) {
            itemModalErrorMessage.textContent = 'O ID único do item é obrigatório.';
            itemModalErrorMessage.classList.add('error-message');
            UIRenderer.showMessage('error', 'O ID único do item é obrigatório.');
            return;
        }
        if (!description) {
            itemModalErrorMessage.textContent = 'A descrição do item é obrigatória.';
            itemModalErrorMessage.classList.add('error-message');
            UIRenderer.showMessage('error', 'A descrição do item é obrigatória.');
            return;
        }
        if (isNaN(basePrice) || basePrice <= 0) {
            itemModalErrorMessage.textContent = 'O preço base deve ser um número positivo.';
            itemModalErrorMessage.classList.add('error-message');
            UIRenderer.showMessage('error', 'O preço base deve ser um número positivo.');
            return;
        }
        if (originalPrice && (isNaN(originalPrice) || originalPrice <= 0 || originalPrice < basePrice)) {
            itemModalErrorMessage.textContent = 'O preço original deve ser um número positivo e maior que o preço base, se informado.';
            itemModalErrorMessage.classList.add('error-message');
            UIRenderer.showMessage('error', 'Preço original inválido.');
            return;
        }
        if (!categoryId) {
            itemModalErrorMessage.textContent = 'A categoria do item é obrigatória.';
            itemModalErrorMessage.classList.add('error-message');
            UIRenderer.showMessage('error', 'A categoria do item é obrigatória.');
            return;
        }

        // Validação de ingredientes padrão
        const defaultIngredients = [];
        let defaultIngredientError = false;
        modal.querySelectorAll('#default-ingredients-container .ingredient-row').forEach(row => {
            const diName = row.querySelector('[name="default_ingredient_name"]').value.trim();
            const diIdName = row.querySelector('[name="default_ingredient_id_name"]').value.trim();
            if (!diName || !diIdName) {
                defaultIngredientError = true;
            }
            defaultIngredients.push({
                name: diName,
                id_name: diIdName,
                included: row.querySelector('[name="default_ingredient_included"]').checked,
                removable: row.querySelector('[name="default_ingredient_removable"]').checked,
            });
        });
        if (defaultIngredientError) {
            itemModalErrorMessage.textContent = 'Todos os ingredientes padrão devem ter Nome e ID Único preenchidos.';
            itemModalErrorMessage.classList.add('error-message');
            UIRenderer.showMessage('error', 'Preencha todos os campos de ingredientes padrão.');
            return;
        }

        // Validação de opções customizáveis
        const customizableOptions = [];
        let customizableOptionError = false;
        modal.querySelectorAll('#customizable-options-container .option-row').forEach(row => {
            const optName = row.querySelector('[name="option_name"]').value.trim();
            const optIdName = row.querySelector('[name="option_id_name"]').value.trim();
            const optionType = row.querySelector('[name="option_type"]').value;
            const priceChange = parseFloat(row.querySelector('[name="price_change"]').value);

            if (!optName || !optIdName || isNaN(priceChange)) {
                customizableOptionError = true;
            }

            const optionData = {
                name: optName,
                id_name: optIdName,
                option_type: optionType,
                price_change: priceChange,
            };

            if (optionType === 'add') {
                const minQty = parseInt(row.querySelector('[name="min_quantity"]').value);
                const maxQty = parseInt(row.querySelector('[name="max_quantity"]').value);
                const defaultQty = parseInt(row.querySelector('[name="default_quantity"]').value);

                if (isNaN(minQty) || isNaN(maxQty) || isNaN(defaultQty) || minQty < 0 || maxQty < minQty || defaultQty < minQty || defaultQty > maxQty) {
                    customizableOptionError = true;
                }
                optionData.min_quantity = minQty;
                optionData.max_quantity = maxQty;
                optionData.default_quantity = defaultQty;
            } else if (optionType === 'variant') {
                const variantGroup = row.querySelector('[name="variant_group"]').value.trim();
                if (!variantGroup) {
                    customizableOptionError = true;
                }
                optionData.variant_group = variantGroup;
                optionData.default_selected = row.querySelector('[name="default_selected"]').checked;
            }
            customizableOptions.push(optionData);
        });

        if (customizableOptionError) {
            itemModalErrorMessage.textContent = 'Verifique todos os campos das opções customizáveis (Nome, ID Único, Preço, Quantidades/Grupo de Variante).';
            itemModalErrorMessage.classList.add('error-message');
            UIRenderer.showMessage('error', 'Preencha corretamente todas as opções customizáveis.');
            return;
        }


        const formData = new FormData(e.target);
        // Sobrescrever os campos JSON com os dados validados
        formData.set('default_ingredients', JSON.stringify(defaultIngredients));
        formData.set('customizable_options', JSON.stringify(customizableOptions));
        // Adicionar o category como db_id
        formData.set('category', categoryId);


        await onSave(formData);
    });

    modal.querySelector('.add-ingredient-btn').addEventListener('click', () => addIngredientRow(modal.querySelector('#default-ingredients-container')));
    modal.querySelector('.add-option-btn').addEventListener('click', () => addOptionRow(modal.querySelector('#customizable-options-container')));

    if (isEditing) {
        (item.default_ingredients || []).forEach(ing => addIngredientRow(modal.querySelector('#default-ingredients-container'), ing));
        (item.customizable_options || []).forEach(opt => addOptionRow(modal.querySelector('#customizable-options-container'), opt));
    }

    setupFormErrorDisplay('item-form', 'item-modal-error-message');
}