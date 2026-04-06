const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const GUEST_MODE_KEY = 'guestMode';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens({ accessToken, refreshToken }) {
  // Logged-in state overrides guest mode
  localStorage.removeItem(GUEST_MODE_KEY);
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function setGuestMode() {
  localStorage.setItem(GUEST_MODE_KEY, '1');
}

export function isGuestMode() {
  return localStorage.getItem(GUEST_MODE_KEY) === '1';
}

export function clearGuestMode() {
  localStorage.removeItem(GUEST_MODE_KEY);
}
