import { apiLogin, apiRegister } from "../../helper/api";

const STORAGE_KEY = "user";

export async function login(email, password) {
  const user = await apiLogin({ email, password });
  const normalized = {
    ...user,
    role: String(user.role || "student").toLowerCase(),
    school_id: user.school_id, // include school_id
    section: user.section,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export async function register(payload = {}) {
  await apiRegister(payload);

  const email = payload?.email;
  const password = payload?.password;
  const user = await apiLogin({ email, password });
  const normalized = {
    ...user,
    role: String(user.role || "student").toLowerCase(),
    school_id: user.school_id, // include school_id
    section: user.section,
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

  try {
    window.location.replace("/");
  } catch {
    // ignore
  }
}