const INVENTORY_KEY = "inventory";

/* STUDENT LOADS SAME INVENTORY AS ADMIN */
export function loadScheduleInventory(user) {
	return JSON.parse(
		localStorage.getItem(INVENTORY_KEY) || "[]"
	);
}

/* STUDENT BORROW UPDATES SAME INVENTORY */
export function saveScheduleInventory(user, inventory) {
	localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
}
