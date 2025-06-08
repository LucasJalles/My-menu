// Menu/js/auth.js
import { getRestaurantSlugFromUrl, BASE_API_DOMAIN } from './config.js'; // Importe BASE_API_DOMAIN
import * as UIRenderer from './uiRenderer.js';

// Use BASE_API_DOMAIN
const AUTH_API_BASE_URL = `${BASE_API_DOMAIN}/api/token/`; // Usa a nova constante

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
            return { success: false, message: data.detail || "Credenciais inválidas." };
        }
    } catch (error) {
        console.error("Erro de rede ou ao tentar login:", error);
        UIRenderer.showMessage('error', "Não foi possível conectar ao servidor de autenticação.");
        return { success: false, message: "Não foi possível conectar ao servidor." };
    }
}

export function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    console.log("Logout realizado. Tokens removidos.");
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
        UIRenderer.showMessage('info', 'Sua sessão expirou. Por favor, faça login novamente.');
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
            logout();
            UIRenderer.showMessage('error', data.detail || 'Sua sessão expirou. Por favor, faça login novamente.');
            return false;
        }
    } catch (error) {
        console.error("Erro de rede ao renovar token:", error);
        logout();
        UIRenderer.showMessage('error', 'Erro de conexão ao tentar renovar sua sessão.');
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
