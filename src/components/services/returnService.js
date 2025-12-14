import { loadReservations, updateReservationStatus } from "./reservationService";
import {
	loadScheduleInventory,
	saveScheduleInventory
} from "./scheduleInventory";

export function returnReservation(reservationId) {
	const reservations = loadReservations();
	const res = reservations.find(r => r.id === reservationId);

	if (!res || res.status !== "released") return;

	const inventory = loadScheduleInventory({ schedule: res.schedule });

	const updatedInventory = inventory.map(inv => {
		const item = res.items.find(i => i.id === inv.id);
		if (!item) return inv;

		return {
			...inv,
			qty: inv.qty + item.qty
		};
	});

	saveScheduleInventory({ schedule: res.schedule }, updatedInventory);
	updateReservationStatus(reservationId, "returned");
}
