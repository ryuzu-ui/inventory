const BASE_INVENTORY_KEY = "inventory";
const SCHEDULE_INV_PREFIX = "schedule_inventory_";

export function getScheduleKey(user) {
	return `${SCHEDULE_INV_PREFIX}${user.schedule.day}_${user.schedule.time}`;
}

export function loadScheduleInventory(user) {
	if (!user || !user.schedule) return [];

	const base = JSON.parse(localStorage.getItem(BASE_INVENTORY_KEY)) || [];
	const key = getScheduleKey(user);

	const saved = localStorage.getItem(key);
	if (saved) return JSON.parse(saved);

	localStorage.setItem(key, JSON.stringify(base));
	return base;
}

export function saveScheduleInventory(user, inventory) {
	if (!user || !user.schedule) return;
	const key = getScheduleKey(user);
	localStorage.setItem(key, JSON.stringify(inventory));
}
