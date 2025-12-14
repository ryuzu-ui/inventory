import { useState } from "react";
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

const primaryBtn = {
	background: "#0d47a1",
	color: "#fff",
	border: "none",
	padding: "8px 16px",
	borderRadius: "6px",
	cursor: "pointer"
};

const warnBtn = (disabled) => ({
	background: disabled ? "#ccc" : "#fbbc04",
	border: "none",
	padding: "8px 16px",
	borderRadius: "6px",
	cursor: disabled ? "not-allowed" : "pointer"
});

const dangerBtn = (disabled) => ({
	background: disabled ? "#ccc" : "#d93025",
	color: "#fff",
	border: "none",
	padding: "8px 16px",
	borderRadius: "6px",
	cursor: disabled ? "not-allowed" : "pointer"
});

/* ================= COMPONENT ================= */

export default function AdminCalendar() {
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState(null);
	const [reason, setReason] = useState("");
	const [hovered, setHovered] = useState(null);
	const [selectedRow, setSelectedRow] = useState(null);

	const [noPassDays, setNoPassDays] = useState(() => {
		const saved = localStorage.getItem("noPassDays");
		return saved ? JSON.parse(saved) : [];
	});

	const save = (list) => {
		setNoPassDays(list);
		localStorage.setItem("noPassDays", JSON.stringify(list));
	};

	/* ================= HELPERS ================= */

	const sameDate = (a, b) =>
		a && b &&
		a.year === b.year &&
		a.month === b.month &&
		a.day === b.day;

	const getReason = (d) =>
		noPassDays.find(x => sameDate(x, d))?.reason;

	const formatDate = (d) =>
		`${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;

	/* ================= CRUD ================= */

	const addOrUpdate = () => {
		if (!selectedDate || !reason.trim()) return;

		const exists = noPassDays.find(d => sameDate(d, selectedDate));

		const updated = exists
			? noPassDays.map(d =>
				sameDate(d, selectedDate) ? { ...d, reason } : d
			)
			: [...noPassDays, { ...selectedDate, reason }];

		save(updated);
		setReason("");
		setSelectedDate(null);
	};

	const deleteReason = () => {
		if (!selectedRow) return;
		save(noPassDays.filter(d => d !== selectedRow));
		setSelectedRow(null);
	};

	/* ================= RENDER ================= */

	const renderWeekDays = () =>
		["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d, i) => (
			<div
				key={i}
				style={{
					flex: 1,
					textAlign: "center",
					padding: "10px 0",
					color: i === 0 ? "#d32f2f" : "#333"
				}}
			>
				{d}
			</div>
		));

	const renderCells = () => {
		const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
		const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });

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

				const isSunday = d.getDay() === 0;
				const hasReason = !!getReason(dateObj);
				const isCurrentMonth = isSameMonth(d, currentMonth);

				const color =
					hasReason
						? "#d32f2f"
						: isSunday
							? "#d32f2f"
							: isCurrentMonth ? "#000" : "#999";

				days.push(
					<div
						key={formatDate(dateObj)}
						onClick={() => { setSelectedDate(dateObj); setReason(getReason(dateObj) || ""); }}
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
							background: "#fff",
							boxShadow: "0 2px 5px rgba(0,0,0,.1)",
							color,
							cursor: "pointer",
							position: "relative"
						}}
					>
						{dateObj.day}

						{hovered && sameDate(hovered, dateObj) && hasReason && (
							<div style={{
								position: "absolute",
								bottom: "85px",
								background: "#222",
								color: "#fff",
								padding: "14px",
								borderRadius: "10px",
								width: "220px",
								textAlign: "center",
								boxShadow: "0 6px 16px rgba(0,0,0,.4)"
							}}>
								{getReason(dateObj)}
							</div>
						)}
					</div>
				);

				d = addDays(d, 1);
			}

			rows.push(<div key={d} style={{ display: "flex" }}>{days}</div>);
			days = [];
		}

		return rows;
	};

	/* ================= JSX ================= */

	return (
		<div style={{ maxWidth: "900px", margin: "0 auto", fontFamily: "Arial" }}>
			<h2 style={{ textAlign: "center" }}>Admin Calendar</h2>

			{/* MONTH NAV */}
			<div style={{ display: "flex", justifyContent: "space-between" }}>
				<button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>{"<"}</button>
				<h3>{format(currentMonth, "MMMM yyyy")}</h3>
				<button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>{">"}</button>
			</div>

			<div style={{ display: "flex" }}>{renderWeekDays()}</div>
			{renderCells()}

			{/* ADD / UPDATE */}
			{selectedDate && (
				<div style={{ marginTop: "15px", display: "flex", gap: "8px" }}>
					<b>{formatDate(selectedDate)}</b>
					<input
						value={reason}
						onChange={e => setReason(e.target.value)}
						placeholder="Reason"
						style={{ flex: 1, padding: "8px" }}
					/>
					<button style={primaryBtn} onClick={addOrUpdate}>
						Save
					</button>
				</div>
			)}

			{/* ================= TABLE ================= */}
			<h3 style={{ marginTop: "30px" }}>No-Pass Reasons</h3>

			<div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
				<button
					style={warnBtn(!selectedRow)}
					disabled={!selectedRow}
					onClick={() => {
						setSelectedDate(selectedRow);
						setReason(selectedRow.reason);
					}}
				>
					Update
				</button>

				<button
					style={dangerBtn(!selectedRow)}
					disabled={!selectedRow}
					onClick={deleteReason}
				>
					Delete
				</button>
			</div>

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
							<tr
								key={i}
								onClick={() => setSelectedRow(d)}
								style={{
									cursor: "pointer",
									background: selectedRow === d ? "#e8f0fe" : "transparent"
								}}
							>
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
