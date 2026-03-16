// Утилита для проверки авторизации админа
export const isAdminAuthenticated = () => {
  const token = localStorage.getItem('admin_token');
  // Здесь можно добавить дополнительную проверку токена
  // Например, проверку срока действия или валидности
  return !!token;
};

export const setAdminToken = (token) => {
  localStorage.setItem('admin_token', token);
};

export const removeAdminToken = () => {
  localStorage.removeItem('admin_token');
};

export const getAdminToken = () => {
  return localStorage.getItem('admin_token');
}; 