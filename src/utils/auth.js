export const TOKEN_KEY = "auth_token";

export const getStoredToken = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  console.log('Getting stored token:', token ? 'exists' : 'missing');
  return token;
};

export const setStoredToken = (token) => {
  console.log('Setting token in storage...');
  localStorage.setItem(TOKEN_KEY, token);
  console.log('Token set in storage');
};

export const removeStoredToken = () => {
  console.log('Removing token from storage...');
  localStorage.removeItem(TOKEN_KEY);
  console.log('Token removed from storage');
}; 