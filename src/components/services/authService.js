import { apiLogin, apiRegister } from "../../helper/api";

const STORAGE_KEY = "user";

export async function login(email, password) {
  const user = await apiLogin({ email, password });
  const normalized = { ...user, role: String(user.role || "student").toLowerCase() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export async function register(full_name, email, password) {
  await apiRegister({ full_name, email, password });
  const user = await apiLogin({ email, password });
  const normalized = { ...user, role: String(user.role || "student").toLowerCase() };
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