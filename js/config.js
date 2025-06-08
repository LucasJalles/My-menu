// Menu/js/config.js
export const WHATSAPP_NUMBER = '5521982291789';

// Adicione a URL base da sua API DEPLOYADA AQUI!
// DURANTE O DESENVOLVIMENTO LOCAL: 'http://127.0.0.1:8000'
// PARA DEPLOY NO GITHUB PAGES: 'https://SEU-DOMINIO-API.com' ou 'https://SEU-USUARIO.pythonanywhere.com'
// Se você tem um domínio personalizado para a API, use-o aqui.
export const BASE_API_DOMAIN = 'http://127.0.0.1:8000'; // <<<< MUDE ISSO AO DEPLOYAR SUA API!

export function getRestaurantSlugFromUrl() {
    // Para GitHub Pages, o pathname pode incluir o nome do repositório (ex: /My-menu/seu-restaurante-slug/index.html)
    const pathParts = window.location.pathname.split('/');
    
    // Nome do seu repositório no GitHub Pages. Isso é fixo para o seu caso.
    const repoName = 'My-menu'; 
    let slug = null;

    // Tenta encontrar o slug APÓS o nome do repositório
    const repoIndex = pathParts.indexOf(repoName);
    if (repoIndex !== -1 && pathParts.length > repoIndex + 1) {
        slug = pathParts[repoIndex + 1];
        if (slug.endsWith('.html')) {
            slug = slug.substring(0, slug.length - 5); // Remove .html se presente
        }
    }
    
    // Se não encontrou no caminho APÓS o repo (útil para desenvolvimento local ou domínios personalizados),
    // tenta encontrar o slug diretamente no caminho ou como parâmetro de consulta.
    if (!slug || slug === 'index.html') { // Adicionado 'index.html' para cobrir caso o slug seja o próprio index.html
        const potentialPathSlug = pathParts.find(part => part && part !== 'index.html' && part !== repoName && part !== '');
        if (potentialPathSlug) {
            slug = potentialPathSlug;
        }
    }
    
    // Se ainda não encontrou, tenta obter do parâmetro de consulta (ex: ?slug=bobs)
    if (!slug) {
        const urlParams = new URLSearchParams(window.location.search);
        const querySlug = urlParams.get('slug');
        slug = querySlug;
    }

    return slug || null;
}
