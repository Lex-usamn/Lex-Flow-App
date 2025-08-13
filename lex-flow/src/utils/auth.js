// Utilitários de autenticação para o Lex Flow

/**
 * Verifica se o usuário está autenticado
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('lex_flow_token');
  const user = localStorage.getItem('lex_flow_user');
  return !!(token && user);
};

/**
 * Obtém o token do usuário atual
 */
export const getToken = () => {
  return localStorage.getItem('lex_flow_token');
};

/**
 * Obtém os dados do usuário atual
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('lex_flow_user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error('Erro ao parsear dados do usuário:', e);
      return null;
    }
  }
  return null;
};

/**
 * Salva os dados de autenticação
 */
export const saveAuthData = (user, token) => {
  localStorage.setItem('lex_flow_token', token);
  localStorage.setItem('lex_flow_user', JSON.stringify(user));
};

/**
 * Remove os dados de autenticação (logout)
 */
export const clearAuthData = () => {
  localStorage.removeItem('lex_flow_token');
  localStorage.removeItem('lex_flow_user');
};

/**
 * Faz uma requisição autenticada para a API
 */
export const authenticatedFetch = async (url, options = {}) => {
  const token = getToken();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const mergedOptions = {
    ...options,
    headers: defaultOptions.headers,
  };

  try {
    const response = await fetch(url, mergedOptions);
    
    // Se receber 401, significa que o token expirou
    if (response.status === 401) {
      clearAuthData();
      window.location.reload();
      return null;
    }
    
    return response;
  } catch (error) {
    console.error('Erro na requisição autenticada:', error);
    throw error;
  }
};

/**
 * Verifica se o token é válido fazendo uma requisição para o backend
 */
export const verifyToken = async () => {
  if (!isAuthenticated()) {
    return false;
  }

  try {
    const response = await authenticatedFetch(`${window.location.origin}/api/auth/verify`);
    
    if (response && response.ok) {
      const data = await response.json();
      return data.valid;
    }
    
    return false;
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return false;
  }
};

/**
 * Faz logout do usuário
 */
export const logout = async () => {
  try {
    // Tentar fazer logout no backend
    await authenticatedFetch(`${window.location.origin}/api/auth/logout`, {
      method: 'POST',
    });
  } catch (error) {
    console.error('Erro ao fazer logout no backend:', error);
  } finally {
    // Sempre limpar dados locais
    clearAuthData();
    window.location.reload();
  }
};

/**
 * Hook para verificar autenticação na inicialização do app
 */
export const initializeAuth = async () => {
  if (isAuthenticated()) {
    const isValid = await verifyToken();
    if (!isValid) {
      clearAuthData();
      return false;
    }
    return true;
  }
  return false;
};

