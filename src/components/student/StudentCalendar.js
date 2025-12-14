import { useState, useEffect } from "react";
import {
	startOfMonth,
	endOfMonth,
	startOfWeek,
	endOfWeek,
	addDays,
	isSameMonth,
	addMonths,
	format,
} from "date-fns";

/* ================= STYLES ================= */

const th = {
	padding: "10px",
	border: "1px solid #e0e0e0",
	fontWeight: "600",
	fontSize: "12px",
	textAlign: "center",
	background: "#f5f7fa"
};

const td = {
	padding: "8px",
	border: "1px solid #e0e0e0",
	fontSize: "12px",
	textAlign: "center"
};

/* ================= COMPONENT ================= */

export default function StudentCalendar() {
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [noPassDays, setNoPassDays] = useState([]);
	const [hovered, setHovered] = useState(null);

	/* ================= LOAD DATA ================= */

	useEffect(() => {
		const saved = localStorage.getItem("noPassDays");
		setNoPassDays(saved ? JSON.parse(saved) : []);
	}, []);

	/* ================= HELPERS ================= */

	const sameDate = (a, b) =>
		a &&
		b &&
		a.year === b.year &&
		a.month === b.month &&
		a.day === b.day;

	const getReason = (d) =>
		noPassDays.find(x => sameDate(x, d))?.reason;

	const formatDate = (d) =>
		`${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;

	/* ================= RENDER ================= */

	const renderWeekDays = () =>
		["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d, i) => (
			<div
				key={i}
				style={{
					flex: 1,
					textAlign: "center",
					padding: "10px 0",
					color: i === 0 ? "#d32f2f" : "#333",
					fontWeight: "600"
				}}
			>
				{d}
			</div>
		));

	const renderCells = () => {
		const start = startOfWeek(startOfMonth(currentMonth));
		const end = endOfWeek(endOfMonth(currentMonth));

		let rows = [];
		let days = [];
		let d = new Date(start);

		while (d <= end) {
			for (let i = 0; i < 7; i++) {
				const dateObj = {
					year: d.getFullYear(),
					month: d.getMonth() + 1,
					day: d.getDate()
				};

				const hasReason = !!getReason(dateObj);
				const isCurrentMonth = isSameMonth(d, currentMonth);
				const isSunday = d.getDay() === 0;

				const color =
					hasReason
						? "#d32f2f"
						: isSunday
							? "#d32f2f"
							: isCurrentMonth ? "#000" : "#999";

				days.push(
					<div
						key={formatDate(dateObj)}
						onMouseEnter={() => setHovered(dateObj)}
						onMouseLeave={() => setHovered(null)}
						style={{
							flex: 1,
							height: "70px",
							margin: "2px",
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							borderRadius: "10px",
							background: hasReason ? "#fdecea" : "#fff",
							color,
							boxShadow: "0 2px 5px rgba(0,0,0,.1)",
							position: "relative"
						}}
					>
						{dateObj.day}

						{hovered && sameDate(hovered, dateObj) && hasReason && (
							<div
								style={{
									position: "absolute",
									bottom: "85px",
									background: "#222",
									color: "#fff",
									padding: "12px",
									borderRadius: "10px",
									width: "220px",
									textAlign: "center",
									boxShadow: "0 6px 16px rgba(0,0,0,.4)",
									zIndex: 5
								}}
							>
								{getReason(dateObj)}
							</div>
						)}
					</div>
				);

				d = addDays(d, 1);
			}

			rows.push(
				<div key={d} style={{ display: "flex" }}>
					{days}
				</div>
			);
			days = [];
		}

		return rows;
	};

	/* ================= JSX ================= */

	return (
		<div style={{ maxWidth: "900px", margin: "0 auto", fontFamily: "Arial" }}>
			{/* MONTH NAV */}
			<div style={{ display: "flex", justifyContent: "space-between" }}>
				<button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>
					{"<"}
				</button>
				<h3>{format(currentMonth, "MMMM yyyy")}</h3>
				<button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
					{">"}
				</button>
			</div>

			<div style={{ display: "flex" }}>{renderWeekDays()}</div>
			{renderCells()}

			{/* ================= TABLE ================= */}
			<h3 style={{ marginTop: "30px" }}>No-Pass Days</h3>

			<table style={{ width: "100%", borderCollapse: "collapse" }}>
				<thead>
					<tr>
						<th style={th}>Date</th>
						<th style={th}>Reason</th>
					</tr>
				</thead>
				<tbody>
					{noPassDays.length === 0 ? (
						<tr>
							<td colSpan="2" style={{ padding: "15px", textAlign: "center" }}>
								No records
							</td>
						</tr>
					) : (
						noPassDays.map((d, i) => (
							<tr key={i}>
								<td style={td}>{formatDate(d)}</td>
								<td style={td}>{d.reason}</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
}
