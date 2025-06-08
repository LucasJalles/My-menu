// Menu/js/menu.js
import { getRestaurantSlugFromUrl, BASE_API_DOMAIN } from './config.js'; // Importe BASE_API_DOMAIN
import * as Auth from './auth.js'; 
import * as UIRenderer from './uiRenderer.js'; 

const restaurantSlug = getRestaurantSlugFromUrl();
let API_URL_FOR_RESTAURANT = '';

if (restaurantSlug) {
    // Use BASE_API_DOMAIN
    API_URL_FOR_RESTAURANT = `${BASE_API_DOMAIN}/api/menu/${restaurantSlug}/`; // Usa a nova constante
} else {
    console.error("Erro: Slug do restaurante não encontrado na URL. Verifique o formato da URL (ex: /seu-restaurante-slug/index.html)");
    // Se não há slug, a API_URL_FOR_RESTAURANT deve ser vazia para evitar chamadas quebradas.
}

let currentItemBeingCustomized = null;
export let currentCustomizationState = {};

let allCategories = []; 
let allItems = []; 

// --- FUNÇÕES DE API ---

async function apiRequest(endpoint, method = 'GET', body = null, isFormData = false) { 
    if (!API_URL_FOR_RESTAURANT) {
        console.error("apiRequest: API_URL_FOR_RESTAURANT não definida. Não é possível fazer a requisição.");
        throw new Error("API_URL_FOR_RESTAURANT não definida.");
    }
    const url = `${API_URL_FOR_RESTAURANT}${endpoint}`;
    const headers = { ...Auth.getAuthHeader() }; 

    const config = { method: method };

    if (isFormData) {
        config.body = body; 
    } else if (body) {
        headers['Content-Type'] = 'application/json';
        config.body = JSON.stringify(body);
    }
    
    config.headers = headers; 

    console.log("DEBUG: apiRequest para URL:", url, "com headers:", headers, "e body (FormData/JSON):", body); 

    UIRenderer.showLoadingSpinner(); 

    try {
        const response = await fetch(url, config);
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro na API:', errorData);
            const errorMessage = Object.values(errorData).flat().join(' ');
            throw new Error(errorMessage);
        }
        if (response.status === 204) return true; 
        
        const data = await response.json();
        console.log(`DEBUG: Dados recebidos da API para ${endpoint}:`, data); 
        return data;
    } catch (error) {
        console.error('Erro de rede ou de requisição:', error);
        throw error;
    } finally {
        UIRenderer.hideLoadingSpinner(); 
    }
}

export async function fetchCategories() {
    // A verificação de API_URL_FOR_RESTAURANT já está em apiRequest
    try {
        const fetchedCategories = await apiRequest('categories/'); 
        console.log("DEBUG: fetchCategories retornou:", fetchedCategories); 
        allCategories = fetchedCategories; 
        return allCategories;
    } catch (error) {
        console.error("Erro ao buscar categorias em menu.js:", error); 
        return [];
    }
}

export async function fetchItems(categoryId = null, updateGlobalAllItems = true) { 
    // A verificação de API_URL_FOR_RESTAURANT já está em apiRequest
    let endpoint = 'items/';
    if (categoryId) {
        endpoint += `?category_id=${categoryId}`;
    }
    try {
        const fetchedItems = await apiRequest(endpoint); 
        console.log(`DEBUG: fetchItems para categoryId=${categoryId} (updateGlobalAllItems=${updateGlobalAllItems}) retornou:`, fetchedItems); 
        
        if (updateGlobalAllItems) {
            allItems = fetchedItems; 
            console.log("DEBUG: allItems global atualizado:", allItems); 
        }
        
        return fetchedItems; 
    } catch (error) {
        console.error("Erro ao buscar itens em menu.js:", error); 
        return [];
    }
}

export async function fetchItem(itemId) {
    try {
        const fetchedItem = await apiRequest(`items/${itemId}/`);
        console.log(`DEBUG: fetchItem para itemId=${itemId} retornou:`, fetchedItem); 
        return fetchedItem;
    } catch (error) {
        console.error(`Erro ao buscar item ${itemId} em menu.js:`, error); 
        return null;
    }
}

// --- Funções de CRUD para o Admin ---

export const categoriesAPI = {
    create: (data) => apiRequest('categories/', 'POST', data, true), 
    update: (id, data) => apiRequest(`categories/${id}/`, 'PATCH', data, true), 
    delete: (id) => apiRequest(`categories/${id}/`, 'DELETE'), 
};

export const itemsAPI = {
    create: (data) => apiRequest('items/', 'POST', data, true), 
    update: (id, data) => apiRequest(`items/${id}/`, 'PATCH', data, true), 
    delete: (id) => apiRequest(`items/${id}/`, 'DELETE'),
};

// --- GETTERS DE ESTADO ---

export function getCategories() { return allCategories; }
export function getItems() { return allItems; }
export function getItemsForCategory(categoryId) { 
    return allItems.filter(item => item.categoryId === categoryId); 
}
export function getItemById(itemId) { return allItems.find(item => item.id === itemId); }
export function getCurrentItemBeingCustomized() { return currentItemBeingCustomized; }

// --- LÓGICA DE CUSTOMIZAÇÃO DE ITEM ---

export function setCurrentItemForCustomization(item) {
    console.log("DEBUG: setCurrentItemForCustomization chamado com item:", item); 
    currentItemBeingCustomized = item;
    
    currentCustomizationState = {
        defaultIngredients: {},
        customizableOptions: {},
        overallQuantity: 1
    };

    if (item) {
        item.default_ingredients?.forEach(di => { 
            currentCustomizationState.defaultIngredients[di.id_name] = di.included; 
        });
        console.log("DEBUG: Estado inicial de defaultIngredients:", currentCustomizationState.defaultIngredients); 

        item.customizable_options?.forEach(co => { 
            if (co.option_type === 'add') {
                currentCustomizationState.customizableOptions[co.id_name] = co.default_quantity !== undefined ? co.default_quantity : 0; 
            } else if (co.option_type === 'variant') {
                if (currentCustomizationState.customizableOptions[co.variant_group] === undefined) {
                    const defaultVariant = item.customizable_options.find(v => v.variant_group === co.variant_group && v.default_selected);
                    if (defaultVariant) {
                        currentCustomizationState.customizableOptions[co.variant_group] = defaultVariant.id_name; 
                    } else {
                        const firstInGroup = item.customizable_options.find(v => v.variant_group === co.variant_group);
                        currentCustomizationState.customizableOptions[co.variant_group] = firstInGroup ? firstInGroup.id_name : null; 
                    }
                }
            }
        });
        console.log("DEBUG: Estado inicial de customizableOptions:", currentCustomizationState.customizableOptions); 
    }
}

export function updateCustomizationState(type, optionIdOrGroupId, value) {
    console.log(`DEBUG: updateCustomizationState: type=${type}, id/group=${optionIdOrGroupId}, value=${value}`); 
    if (!currentItemBeingCustomized) {
        console.warn("AVISO: currentItemBeingCustomized é nulo ao tentar atualizar o estado.");
        return false;
    }
    let stateChanged = false;

    switch (type) {
        case 'defaultIngredientToggle':
            const diConfig = currentItemBeingCustomized.default_ingredients.find(di => di.id_name === optionIdOrGroupId); 
            if (diConfig && (diConfig.removable === undefined || diConfig.removable === true)) {
                 currentCustomizationState.defaultIngredients[optionIdOrGroupId] = !currentCustomizationState.defaultIngredients[optionIdOrGroupId];
                 stateChanged = true;
                 console.log("DEBUG: defaultIngredientToggle - Novo estado:", currentCustomizationState.defaultIngredients[optionIdOrGroupId]); 
            } else {
                console.warn("AVISO: Ingrediente padrão não encontrado ou não removível:", optionIdOrGroupId); 
            }
            break;
        case 'addOptionQuantity':
            const coConfig = currentItemBeingCustomized.customizable_options.find(opt => opt.id_name === optionIdOrGroupId && opt.option_type === 'add'); 
            if (coConfig && value >= coConfig.min_quantity && value <= coConfig.max_quantity) {
                if (currentCustomizationState.customizableOptions[optionIdOrGroupId] !== value) {
                    currentCustomizationState.customizableOptions[optionIdOrGroupId] = value;
                    stateChanged = true;
                    console.log("DEBUG: addOptionQuantity - Nova quantidade:", currentCustomizationState.customizableOptions[optionIdOrGroupId]); 
                }
            } else {
                console.warn("AVISO: Opção customizável não encontrada ou quantidade fora dos limites:", optionIdOrGroupId, value); 
            }
            break;
        case 'variantOptionSelect':
            const variantExists = currentItemBeingCustomized.customizable_options.some(opt => 
                opt.variant_group === optionIdOrGroupId && opt.id_name === value
            );
            if (variantExists) {
                if (currentCustomizationState.customizableOptions[optionIdOrGroupId] !== value) {
                    currentCustomizationState.customizableOptions[optionIdOrGroupId] = value;
                    stateChanged = true;
                    console.log("DEBUG: variantOptionSelect - Nova variante selecionada:", currentCustomizationState.customizableOptions[optionIdOrGroupId]); 
                }
            } else {
                console.warn("AVISO: Variante não encontrada ou não pertence ao grupo:", optionIdOrGroupId, value); 
            }
            break;
        case 'overallQuantity':
            if (value >= 1 && currentCustomizationState.overallQuantity !== value) {
                currentCustomizationState.overallQuantity = value;
                stateChanged = true;
                console.log("DEBUG: overallQuantity - Nova quantidade geral:", currentCustomizationState.overallQuantity); 
            } else {
                console.warn("AVISO: Quantidade geral inválida:", value); 
            }
            break;
        default:
            console.warn("Unknown customization type:", type);
    }
    console.log("DEBUG: Estado de customização atualizado (currentCustomizationState):", currentCustomizationState); 
    return stateChanged;
}

export function calculateUnitPrice() {
    console.log("DEBUG: calculateUnitPrice chamado."); 
    if (!currentItemBeingCustomized) return 0;
    let unitPrice = parseFloat(currentItemBeingCustomized.base_price); // CORREÇÃO AQUI: currentItemBeingCustomized
    console.log("DEBUG: Preço base inicial:", unitPrice); 
    
    currentItemBeingCustomized.customizable_options?.forEach(co => { 
        if (co.option_type === 'add') {
            const quantity = currentCustomizationState.customizableOptions[co.id_name] || 0; 
            unitPrice += quantity * parseFloat(co.price_change);
            console.log(`DEBUG: Adicional "${co.name}" (qty=${quantity}) adicionado. Preço atual: ${unitPrice}`); 
        } else if (co.option_type === 'variant') {
            if (currentCustomizationState.customizableOptions[co.variant_group] === co.id_name) { 
                unitPrice += parseFloat(co.price_change);
                console.log(`DEBUG: Variante "${co.name}" selecionada. Preço atual: ${unitPrice}`); 
            }
        }
    });
    console.log("DEBUG: Preço unitário final calculado:", unitPrice); 
    return unitPrice;
}

export function getFinalizedCustomizationDetailsForCart() {
    console.log("DEBUG: getFinalizedCustomizationDetailsForCart chamado."); 
    if (!currentItemBeingCustomized) return null;
    const details = { removedDefaults: [], addedExtras: [], selectedVariants: [] };

    currentItemBeingCustomized.default_ingredients?.forEach(di => { 
        if (di.included && !currentCustomizationState.defaultIngredients[di.id_name] && (di.removable === undefined || di.removable === true)) { 
            details.removedDefaults.push(di.name);
            console.log(`DEBUG: Removido: ${di.name}`); 
        }
    });

    currentItemBeingCustomized.customizable_options?.forEach(co => { 
        if (co.option_type === 'add') {
            const quantity = currentCustomizationState.customizableOptions[co.id_name] || 0; 
            if (quantity > 0) {
                details.addedExtras.push({ id: co.id, name: co.name, quantity: quantity, pricePerUnit: parseFloat(co.price_change) });
                console.log(`DEBUG: Adicionado extra: ${co.name} (${quantity}x)`); 
            }
        } else if (co.option_type === 'variant') {
            if (currentCustomizationState.customizableOptions[co.variant_group] === co.id_name) { 
                details.selectedVariants.push({ id: co.id, name: co.name, priceChange: parseFloat(co.price_change) });
                console.log(`DEBUG: Selecionada variante: ${co.name}`); 
            }
        }
    });
    console.log("DEBUG: Detalhes de customização finalizados:", details); 
    return details;
}
