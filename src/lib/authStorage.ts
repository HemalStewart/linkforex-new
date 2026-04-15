const USER_STORAGE_KEY = 'user';
const AUTH_COOKIE_KEY = 'lf_admin_auth';
const REMEMBERED_LOGIN_KEY = 'remembered_login';

const canUseBrowserStorage = (): boolean => typeof window !== 'undefined';

const writeAuthCookie = (remember: boolean): void => {
    if (typeof document === 'undefined') return;
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    const maxAge = remember ? '; Max-Age=2592000' : '';
    document.cookie = `${AUTH_COOKIE_KEY}=1; Path=/; SameSite=Lax${maxAge}${secure}`;
};

const clearAuthCookie = (): void => {
    if (typeof document === 'undefined') return;
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${AUTH_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
};

export const getStoredUserRaw = (): string | null => {
    if (!canUseBrowserStorage()) return null;
    return localStorage.getItem(USER_STORAGE_KEY) ?? sessionStorage.getItem(USER_STORAGE_KEY);
};

export const getStoredUser = <T = unknown>(): T | null => {
    const raw = getStoredUserRaw();
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
};

export const setStoredUser = (user: unknown, remember = true): void => {
    if (!canUseBrowserStorage()) return;
    const serialized = JSON.stringify(user);
    if (remember) {
        localStorage.setItem(USER_STORAGE_KEY, serialized);
        sessionStorage.removeItem(USER_STORAGE_KEY);
        writeAuthCookie(true);
        return;
    }
    sessionStorage.setItem(USER_STORAGE_KEY, serialized);
    localStorage.removeItem(USER_STORAGE_KEY);
    writeAuthCookie(false);
};

export const clearStoredUser = (): void => {
    if (!canUseBrowserStorage()) return;
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(REMEMBERED_LOGIN_KEY);
    clearAuthCookie();
};
