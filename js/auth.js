// Menu/js/auth.js
import { getRestaurantSlugFromUrl } from './config.js';
import * as UIRenderer from './uiRenderer.js'; // Importado para usar showMessage

// URL do endpoint de autenticação JWT no seu Django
const AUTH_API_BASE_URL = `http://127.0.0.1:8000/api/token/`; // Endpoint para obter tokens

export async function login(username, password) {
    try {
        const response = await fetch(AUTH_API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            console.log("Login bem-sucedido! Tokens armazenados.");
            return { success: true };
        } else {
            console.error("Erro no login:", data);
            // Usando showMessage para exibir o erro
            // UIRenderer.showMessage('error', data.detail || "Credenciais inválidas."); // Esta mensagem será exibida pelo eventHandlers
            return { success: false, message: data.detail || "Credenciais inválidas." };
        }
    } catch (error) {
        console.error("Erro de rede ou ao tentar login:", error);
        UIRenderer.showMessage('error', "Não foi possível conectar ao servidor de autenticação."); // Mensagem toast para erro de rede
        return { success: false, message: "Não foi possível conectar ao servidor." };
    }
}

export function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    console.log("Logout realizado. Tokens removidos.");
    // showMessage para logout já é feito no eventHandlers
}

export function isAuthenticated() {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
        return false;
    }
    return true;
}

export function getAuthToken() {
    return localStorage.getItem('access_token');
}

export async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
        console.warn("Nenhum refresh token encontrado. Requer login.");
        UIRenderer.showMessage('info', 'Sua sessão expirou. Por favor, faça login novamente.'); // Mensagem toast para expiração
        return false;
    }

    try {
        const response = await fetch(`${AUTH_API_BASE_URL}refresh/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('access_token', data.access);
            console.log("Access token renovado com sucesso!");
            return true;
        } else {
            console.error("Falha ao renovar token. Requer novo login.", data);
            logout(); // Remove tokens inválidos
            UIRenderer.showMessage('error', data.detail || 'Sua sessão expirou. Por favor, faça login novamente.'); // Mensagem toast
            return false;
        }
    } catch (error) {
        console.error("Erro de rede ao renovar token:", error);
        logout();
        UIRenderer.showMessage('error', 'Erro de conexão ao tentar renovar sua sessão.'); // Mensagem toast para erro de rede
        return false;
    }
}

export function getAuthHeader() {
    const token = getAuthToken();
    const header = {};
    if (token) {
        header['Authorization'] = `Bearer ${token}`;
    }
    console.log("DEBUG: getAuthHeader() retornando:", header);
    return header;
}