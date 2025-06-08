// Menu/js/main.js
import * as UIRenderer from './uiRenderer.js';
import * as Menu from './menu.js';
import { initializeEventListeners, updateMoreOptionsButtonsVisibility } from './eventHandlers.js';
import * as Auth from './auth.js';
import * as DOM from './domElements.js';
import * as Admin from './admin.js';
import { getRestaurantSlugFromUrl } from './config.js';


document.addEventListener('DOMContentLoaded', async () => {
    console.log("main.js: DOMContentLoaded - Início da inicialização.");
    
    // updateMoreOptionsButtonsVisibility() já será chamado no final, cuidando do display de login/logout
    // moreOptionsContainer visibilidade é controlada por switchView()
    // DOM.authPanelButton.style.display e DOM.logoutButton.style.display serão gerenciados por updateMoreOptionsButtonsVisibility()

    // Oculta todas as vistas no início, para que o switchView() possa definir a vista inicial
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active-view'));

    let categories = []; 

    // Decide qual vista iniciar e quais botões mostrar/esconder
    if (Auth.isAuthenticated()) {
        console.log("main.js: Usuário autenticado. Inicializando admin panel.");
        UIRenderer.switchView('admin-panel-view'); 
        Admin.initializeAdminPanel(); 
        
        // moreOptionsContainer será hidden via switchView('admin-panel-view')
    } else {
        console.log("main.js: Usuário NÃO autenticado. Carregando cardápio público.");
        categories = await Menu.fetchCategories();
        UIRenderer.switchView('categories-view'); 
        UIRenderer.renderCategories(categories);

        // moreOptionsContainer será visível via switchView('categories-view')
    }

    // Atualiza a visibilidade inicial dos botões Login/Sair no dropdown (chamado uma vez após a view ser definida)
    updateMoreOptionsButtonsVisibility(); 

    UIRenderer.updateCartSummary();
    UIRenderer.hideInlineCustomizationPanel();

    console.log("main.js: Inicializando Event Listeners.");
    initializeEventListeners();

    console.log("Cardápio Dinâmico v2 (Revisado) Iniciado com API Django!");
});
