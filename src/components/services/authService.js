import { apiLogin, apiRegister } from "../../helper/api";

const STORAGE_KEY = "user";

// Login using DB
export async function login(email, password) {
  const user = await apiLogin({ email, password });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

// Register then auto-login (optional)
export async function register(full_name, email, password) {
  await apiRegister({ full_name, email, password });
  // Auto-login after register for convenience
  const user = await apiLogin({ email, password });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

export function getUser() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}
