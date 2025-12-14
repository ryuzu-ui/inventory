import { loadReservations, saveReservations } from "./reservationService";

export function releaseReservation(reservation) {
	const inventory = JSON.parse(localStorage.getItem("inventory")) || [];
	const reservations = loadReservations();

	const updatedInventory = inventory.map(item => {
		const borrowedItem = reservation.items.find(i => i.id === item.id);
		if (!borrowedItem) return item;

		return {
			...item,
			borrowed: Math.max(
				0,
				(item.borrowed || 0) - Number(borrowedItem.qty)
			)
		};
	});

	const updatedReservations = reservations.map(r =>
		r.id === reservation.id
			? { ...r, status: "returned" }
			: r
	);

	localStorage.setItem("inventory", JSON.stringify(updatedInventory));
	saveReservations(updatedReservations);
}
