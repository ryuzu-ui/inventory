const BASE_INVENTORY_KEY = "inventory";
const SCHEDULE_INV_PREFIX = "schedule_inventory_";

/**
 * Generate unique key per schedule
 * example:
 * schedule_inventory_Saturday_08:00-10:00
 */
function getScheduleKey(user) {
	return `${SCHEDULE_INV_PREFIX}${user.schedule.day}_${user.schedule.time}`;
}

/**
 * Load inventory for student's schedule
 */
export function loadScheduleInventory(user) {
	if (!user || !user.schedule) return [];

	const base = JSON.parse(localStorage.getItem(BASE_INVENTORY_KEY)) || [];
	const key = getScheduleKey(user);

	const saved = localStorage.getItem(key);
	if (saved) return JSON.parse(saved);

	// First time this schedule is used → clone base inventory
	localStorage.setItem(key, JSON.stringify(base));
	return base;
}

/**
 * Save inventory for student's schedule
 */
export function saveScheduleInventory(user, inventory) {
	if (!user || !user.schedule) return;

	const key = getScheduleKey(user);
	localStorage.setItem(key, JSON.stringify(inventory));
}
