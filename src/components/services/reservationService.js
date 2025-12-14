const KEY = "reservations";

export function loadReservations() {
	return JSON.parse(localStorage.getItem(KEY) || "[]");
}

export function saveReservations(data) {
	localStorage.setItem(KEY, JSON.stringify(data));
}

export function addReservation(reservation) {
	const list = loadReservations();
	saveReservations([...list, reservation]);
}

export function updateReservationStatus(id, status) {
	const list = loadReservations().map(r =>
		r.id === id ? { ...r, status } : r
	);
	saveReservations(list);
}
