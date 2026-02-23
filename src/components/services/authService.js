import { apiLogin, apiRegister } from "../../helper/api";

const STORAGE_KEY = "user";

export async function login(email, password) {
  const user = await apiLogin({ email, password });
  const normalized = {
    ...user,
    role: String(user.role || "student").toLowerCase(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

// ✅ UPDATED: accept options (role, admin_secret, etc.)
export async function register(full_name, email, password, options = {}) {
  await apiRegister({ full_name, email, password, ...options });

  const user = await apiLogin({ email, password });
  const normalized = {
    ...user,
    role: String(user.role || "student").toLowerCase(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function getUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}