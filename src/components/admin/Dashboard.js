import { useState } from "react";
import { loadReservations } from "../services/reservationService";
import { approveReservation } from "../services/approveService";
import { releaseReservation } from "../services/releaseService";

export default function Dashboard() {
	const [reservations, setReservations] = useState(loadReservations());

	const refresh = () => {
		setReservations(loadReservations());
	};

	return (
		<div>
			<h2>Admin Dashboard</h2>

			<table border="1" cellPadding="8" width="100%">
				<thead>
					<tr>
						<th>Name</th>
						<th>Schedule</th>
						<th>Items</th>
						<th>Status</th>
						<th>Action</th>
					</tr>
				</thead>

				<tbody>
					{reservations.length === 0 ? (
						<tr>
							<td colSpan="5" align="center">
								No reservations
							</td>
						</tr>
					) : (
						reservations.map(r => (
							<tr key={r.id}>
								<td>{r.name}</td>

								<td>
									{r.schedule
										? `${r.schedule.day} ${r.schedule.time}`
										: "No schedule"}
								</td>

								<td>
									{r.items.map(i => (
										<div key={i.id}>
											{i.tools} × {i.qty}
										</div>
									))}
								</td>

								{/* ✅ STATUS */}
								<td>
									{r.status === "reserved" && "Pending"}
									{r.status === "approved" && "Approved"}
									{r.status === "returned" && "Returned"}
								</td>

								{/* ✅ ACTION */}
								<td>
									{r.status === "reserved" && (
										<button
											onClick={() => {
												approveReservation(r);
												refresh();
											}}
										>
											Approve
										</button>
									)}

									{r.status === "approved" && (
										<button
											onClick={() => {
												releaseReservation(r);
												refresh();
											}}
										>
											Return
										</button>
									)}

									{r.status === "returned" && (
										<span>-</span>
									)}
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
}
