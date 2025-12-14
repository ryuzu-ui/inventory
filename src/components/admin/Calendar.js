import { useState } from "react";
import {
	startOfMonth,
	endOfMonth,
	startOfWeek,
	endOfWeek,
	addDays,
	isSameMonth,
	addMonths,
	isWeekend,
	format,
} from "date-fns";

export default function Calendar() {
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState(null);
	const [reason, setReason] = useState("");
	const [noPassDays, setNoPassDays] = useState(() => {
		const saved = localStorage.getItem("noPassDays");
		return saved ? JSON.parse(saved) : [];
	});

	const saveNoPassDays = (newList) => {
		setNoPassDays(newList);
		localStorage.setItem("noPassDays", JSON.stringify(newList));
	};

	const prevMonth = () => setCurrentMonth(addMonths(currentMonth, -1));
	const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

	// Click a day in calendar
	const handleDateClick = (date) => {
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();
		setSelectedDate({ year, month, day }); // numbers only
		setReason("");
	};

	const addNoPassDay = () => {
		if (!selectedDate || !reason.trim()) return;

		const newList = [...noPassDays, { ...selectedDate, reason }];
		saveNoPassDays(newList);
		setSelectedDate(null);
		setReason("");
	};

	const removeNoPassDay = (index) => {
		const newList = [...noPassDays];
		newList.splice(index, 1);
		saveNoPassDays(newList);
	};

	const formatDate = (entry) =>
		`${entry.year}-${entry.month.toString().padStart(2, "0")}-${entry.day
			.toString()
			.padStart(2, "0")}`;

	const renderWeekDays = () =>
		["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
			<div
				key={idx}
				style={{
					flex: 1,
					textAlign: "center",
					fontWeight: "600",
					padding: "10px 0",
					color: idx === 0 || idx === 6 ? "#d32f2f" : "#333",
				}}
			>
				{day}
			</div>
		));

	const renderCells = () => {
		const monthStart = startOfMonth(currentMonth);
		const monthEnd = endOfMonth(monthStart);
		const startDate = startOfWeek(monthStart);
		const endDate = endOfWeek(monthEnd);

		const rows = [];
		let days = [];
		let currentDay = startDate;

		while (currentDay <= endDate) {
			for (let i = 0; i < 7; i++) {
				const year = currentDay.getFullYear();
				const month = currentDay.getMonth() + 1;
				const day = currentDay.getDate();

				const isNoPass = noPassDays.some(
					nd => nd.year === year && nd.month === month && nd.day === day
				);

				const isCurrentMonth = isSameMonth(currentDay, currentMonth);
				const isWeekendDay = isWeekend(currentDay);

				days.push(
					<div
						key={`${year}-${month}-${day}`}
						onClick={() => handleDateClick(currentDay)}
						style={{
							flex: 1,
							height: "70px",
							margin: "2px",
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							backgroundColor: isNoPass
								? "#f44336"
								: isCurrentMonth
								? "#fff"
								: "#f5f5f5",
							color: isNoPass
								? "#fff"
								: isCurrentMonth
								? isWeekendDay
									? "#d32f2f"
									: "#000"
								: "#999",
							borderRadius: "10px",
							cursor: "pointer",
							boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
							userSelect: "none",
							fontWeight: isNoPass ? "600" : "400",
						}}
						onMouseEnter={(e) => {
							if (!isNoPass) e.currentTarget.style.background = "#e0e0e0";
						}}
						onMouseLeave={(e) => {
							if (!isNoPass)
								e.currentTarget.style.background = isCurrentMonth ? "#fff" : "#f5f5f5";
						}}
					>
						{day}
					</div>
				);

				currentDay = addDays(currentDay, 1);
			}

			rows.push(
				<div key={currentDay.toString()} style={{ display: "flex", marginBottom: "4px" }}>
					{days}
				</div>
			);
			days = [];
		}

		return <div>{rows}</div>;
	};

	return (
		<div style={{ maxWidth: "750px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
			<h2 style={{ textAlign: "center", marginBottom: "15px" }}>Admin Calendar</h2>

			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
				<button onClick={prevMonth} style={{ padding: "6px 12px" }}>{"<"}</button>
				<h3>{format(currentMonth, "MMMM yyyy")}</h3>
				<button onClick={nextMonth} style={{ padding: "6px 12px" }}>{">"}</button>
			</div>

			<div style={{ display: "flex", marginBottom: "6px" }}>{renderWeekDays()}</div>
			{renderCells()}

			{selectedDate && (
				<div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
					<h4>
						Reason for no-pass on <strong>{formatDate(selectedDate)}</strong>:
					</h4>
					<input
						type="text"
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						placeholder="Enter reason"
						style={{ padding: "6px", flex: 1 }}
					/>
					<button onClick={addNoPassDay} style={{ padding: "6px 12px" }}>Add</button>
				</div>
			)}

			<h3 style={{ marginTop: "25px" }}>No-Pass Days</h3>
			{noPassDays.length === 0 ? (
				<p>No entries yet.</p>
			) : (
				<div style={{ maxHeight: "250px", overflowY: "auto" }}>
					<table style={{ width: "100%", borderCollapse: "collapse" }}>
						<thead>
							<tr>
								<th style={{ border: "1px solid #ddd", padding: "8px" }}>Date</th>
								<th style={{ border: "1px solid #ddd", padding: "8px" }}>Reason</th>
								<th style={{ border: "1px solid #ddd", padding: "8px" }}>Action</th>
							</tr>
						</thead>
						<tbody>
							{noPassDays
								.map((d, idx) => (
									<tr key={idx}>
										<td style={{ border: "1px solid #ddd", padding: "8px" }}>{formatDate(d)}</td>
										<td style={{ border: "1px solid #ddd", padding: "8px" }}>{d.reason}</td>
										<td style={{ border: "1px solid #ddd", padding: "8px" }}>
											<button onClick={() => removeNoPassDay(idx)}>Remove</button>
										</td>
									</tr>
								))
								.reverse()}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
