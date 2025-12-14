// key example:
// inventory_Kitchen Lab_Saturday_08:00_10:00

export function getInventoryKey({ lab, schedule }) {
	return `inventory_${lab}_${schedule.day}_${schedule.start}_${schedule.end}`;
}

export function getInventoryForSchedule(context) {
	const key = getInventoryKey(context);
	const saved = localStorage.getItem(key);
	return saved ? JSON.parse(saved) : [];
}

export function saveInventoryForSchedule(context, inventory) {
	const key = getInventoryKey(context);
	localStorage.setItem(key, JSON.stringify(inventory));
}
