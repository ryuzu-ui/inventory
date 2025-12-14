const KEY = "inventory";

export function loadInventory() {
	return JSON.parse(localStorage.getItem(KEY) || "[]");
}

export function saveInventory(data) {
	localStorage.setItem(KEY, JSON.stringify(data));
}
