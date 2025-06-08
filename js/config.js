// Menu/js/config.js
export const WHATSAPP_NUMBER = '5521982291789';

export function getRestaurantSlugFromUrl() {
    // Tenta obter o slug do caminho da URL (ex: /bobs/index.html)
    const pathParts = window.location.pathname.split('/');
    const pathSlug = pathParts.find(part => part && part !== 'index.html');
    
    if (pathSlug) {
        return pathSlug;
    }

    // Se não encontrou no caminho, tenta obter do parâmetro de consulta (ex: ?slug=bobs)
    const urlParams = new URLSearchParams(window.location.search);
    const querySlug = urlParams.get('slug'); // Pega o valor do parâmetro 'slug'

    return querySlug || null; // Retorna o slug encontrado ou null
}