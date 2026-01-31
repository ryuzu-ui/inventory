import { useState, useMemo } from "react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer
} from "recharts";

import { loadReservations } from "../services/reservationService";
import { approveReservation } from "../services/approveService";
import { releaseReservation } from "../services/releaseService";

export default function Dashboard() {
	const [reservations, setReservations] = useState(loadReservations());

	const refresh = () => setReservations(loadReservations());

	// ================= KPIs =================
	const total = reservations.length;
	const pending = reservations.filter(r => r.status === "reserved").length;
	const approved = reservations.filter(r => r.status === "approved").length;
	const returned = reservations.filter(r => r.status === "returned").length;

	// ================= STATUS CHART =================
	const statusData = [
		{ name: "Pending", value: pending },
		{ name: "Approved", value: approved },
		{ name: "Returned", value: returned }
	];

	// ================= TOOLS CHART =================
	const toolsData = useMemo(() => {
		const map = {};
		reservations.forEach(r => {
			r.items.forEach(i => {
				map[i.tools] = (map[i.tools] || 0) + i.qty;
			});
		});
		return Object.entries(map).map(([name, value]) => ({ name, value }));
	}, [reservations]);

	return (
		<div style={{ padding: "20px" }}>
			<h2>Inventory Dashboard</h2>

			{/* ===== KPI CARDS ===== */}
			<div style={styles.grid}>
				<Card title="Total Reservations" value={total} />
				<Card title="Pending" value={pending} />
				<Card title="Approved" value={approved} />
				<Card title="Returned" value={returned} />
			</div>

			{/* ===== CHARTS ===== */}
			<div style={{ ...styles.grid, marginTop: 20 }}>
				<ChartCard title="Reservation Status">
					<ResponsiveContainer width="100%" height={250}>
						<BarChart data={statusData}>
							<XAxis dataKey="name" />
							<YAxis />
							<Tooltip />
							<Bar dataKey="value" />
						</BarChart>
					</ResponsiveContainer>
				</ChartCard>

				<ChartCard title="Most Reserved Tools">
					<ResponsiveContainer width="100%" height={250}>
						<BarChart data={toolsData}>
							<XAxis dataKey="name" />
							<YAxis />
							<Tooltip />
							<Bar dataKey="value" />
						</BarChart>
					</ResponsiveContainer>
				</ChartCard>
			</div>

			{/* ===== TABLE ===== */}
			<h3 style={{ marginTop: 30 }}>Reservations</h3>
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
							<td colSpan="5" align="center">No reservations</td>
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
								<td>
									{r.status === "reserved" && "Pending"}
									{r.status === "approved" && "Approved"}
									{r.status === "returned" && "Returned"}
								</td>
								<td>
									{r.status === "reserved" && (
										<button onClick={() => { approveReservation(r); refresh(); }}>
											Approve
										</button>
									)}
									{r.status === "approved" && (
										<button onClick={() => { releaseReservation(r); refresh(); }}>
											Return
										</button>
									)}
									{r.status === "returned" && "-"}
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
}

// ================= COMPONENTS =================
function Card({ title, value }) {
	return (
		<div style={styles.card}>
			<h4>{title}</h4>
			<h2>{value}</h2>
		</div>
	);
}

function ChartCard({ title, children }) {
	return (
		<div style={{ ...styles.card, height: 320 }}>
			<h4>{title}</h4>
			{children}
		</div>
	);
}

const styles = {
	grid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
		gap: "16px"
	},
	card: {
		background: "#fff",
		padding: "16px",
		borderRadius: "10px",
		boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
	}
};
