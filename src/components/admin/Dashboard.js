import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  Line,
  LineChart
} from "recharts";

import {
  getAdminStats,
  getAdminRoomReservations,
  updateReservationStatus,
} from "../../helper/api";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

/* ✅ BLACK TOOLTIP */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#fff",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          color: "black",
        }}
      >
        <p style={{ margin: 0 }}>{label}</p>
        <p style={{ margin: 0 }}>
          value: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const calendarEvents = useMemo(() => {
    return reservations.map(r => ({
      title: r.room_name,
      date: String(r.reservation_date).slice(0,10)
    }));
  }, [reservations]);

  const refresh = async () => {
    setLoading(true);
    setMessage("");
    try {
      const s = await getAdminStats();
      setStats(s?.reservations || null);

      const list = await getAdminRoomReservations({ status: "pending" });
      setReservations(list);
    } catch (e) {
      setMessage(e.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const total = stats?.total ?? 0;
  const pending = stats?.pending ?? 0;
  const approved = stats?.approved ?? 0;
  const cancelled = stats?.cancelled ?? 0;

  const statusData = useMemo(
    () => [
      { name: "Pending", value: pending },
      { name: "Approved", value: approved },
      { name: "Cancelled", value: cancelled },
    ],
    [pending, approved, cancelled]
  );

  const roomsData = useMemo(() => {
    const map = {};
    reservations.forEach((r) => {
      const key = r.room_name || `Room ${r.lab_room_id}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [reservations]);

  const handleSetStatus = async (id, status) => {
    try {
      setMessage("");
      await updateReservationStatus({ id, status });
      setMessage(`Reservation ${status}.`);
      await refresh();
    } catch (e) {
      setMessage(e.message || "Failed to update status.");
    }
  };

  const getStatusColor = (status) => {
    switch (String(status).toLowerCase()) {
      case "pending":
        return "#facc15";
      case "approved":
        return "#2563eb";
      case "cancelled":
      case "rejected":
        return "#dc2626";
      default:
        return "#000";
    }
  };

	return (
	<div style={styles.dashboard}>

		{/* HEADER */}
		<div style={styles.header}>
			<h2>Dashboard User</h2>

			<button onClick={refresh} style={styles.refreshBtn}>
				Refresh
			</button>
		</div>

		{/* KPI CARDS */}
		<div style={styles.topCards}>
			<Card title="Total Reservations" value={total} />
			<Card title="Pending" value={pending} color="#facc15" />
			<Card title="Approved" value={approved} color="#2563eb" />
			<Card title="Cancelled" value={cancelled} color="#dc2626" />
		</div>

          {/* CHARTS */}

          <div style={styles.chartGrid}>

            {/* BAR CHART */}
            <ChartCard title="Reservation Status">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <XAxis dataKey="name"/>
                  <YAxis allowDecimals={false}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Bar dataKey="value">
                    {statusData.map((entry,index)=>(
                      <Cell key={index} fill={getStatusColor(entry.name)} />
                    ))}
                    <LabelList dataKey="value" position="top"/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* PROGRESS */}
            <ProgressWidget/>

            {/* LINE CHART */}
            <ChartCard title="Pending Requests by Room">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={roomsData}>
                  <XAxis dataKey="name"/>
                  <YAxis allowDecimals={false}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#f59e0b"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* CALENDAR */}
            <MiniCalendar events={calendarEvents}/>

          </div>

		{/* TABLE */}
		<div style={{marginTop:"30px"}}>

			<h3>Pending Room Reservations</h3>

			<div style={styles.tableCard}>

				<table style={styles.table}>
					<thead>
						<tr>
							<th>Requested By</th>
							<th>Room</th>
							<th>Date</th>
							<th>Time</th>
							<th>Status</th>
							<th>Action</th>
						</tr>
					</thead>

					<tbody>

						{reservations.length === 0 ? (
							<tr>
								<td colSpan="6" align="center">
									No pending reservations
								</td>
							</tr>
						) : (
							reservations.map((r)=>(
								<tr key={r.id}>

									<td>{r.reserved_by_name || `User #${r.reserved_by}`}</td>

									<td>{r.room_name}</td>

									<td>{String(r.reservation_date).slice(0,10)}</td>

									<td>
										{String(r.start_time).slice(0,5)} –
										{String(r.end_time).slice(0,5)}
									</td>

									<td>{r.status}</td>

									<td>

										{String(r.status).toLowerCase()==="pending" ? (

											<div style={{display:"flex",gap:"8px"}}>

												<button
													onClick={()=>handleSetStatus(r.id,"approved")}
													style={styles.approveBtn}
												>
													Approve
												</button>

												<button
													onClick={()=>handleSetStatus(r.id,"cancelled")}
													style={styles.rejectBtn}
												>
													Reject
												</button>

											</div>

										) : "-"}

									</td>

								</tr>
							))
						)}

					</tbody>
				</table>

			</div>

		</div>

	</div>
);
}

function Card({ title, value, dark }) {

	return (
		<div style={{
			...styles.statCard,
			background: dark ? "#1f3b63" : "#fff",
			color: dark ? "#fff" : "#333"
		}}>

			<div style={styles.statTop}>
				<span>{title}</span>
				<span style={styles.icon}>★</span>
			</div>

			<h2 style={{marginTop:"10px"}}>
				{value}
			</h2>

		</div>
	);

}

function ChartCard({ title, children }) {
  return (
    <div style={{...styles.card, height:"320px"}}>
      <h4>{title}</h4>
      {children}
    </div>
  );
}

function ProgressWidget() {
  return (
    <div style={styles.progressCard}>
      <h4>Progress</h4>

      <div style={styles.donut}>
        <div style={styles.donutInner}>45%</div>
      </div>

      <div style={styles.progressText}>
        <p>Lorem ipsum</p>
        <p>Lorem ipsum</p>
        <p>Lorem ipsum</p>
      </div>

      <button style={styles.orangeBtn}>
        Check Now
      </button>
    </div>
  );
}

function MiniCalendar({ events }) {

	return (
		<div style={styles.calendarCard}>

			<h4 style={{marginBottom:"10px"}}>Room Calendar</h4>

			<FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        height="220px"
				headerToolbar={{
					left:"prev,next",
					center:"title",
					right:""
				}}
				events={events}
			/>

		</div>
	);

}

const styles = {

	dashboard:{
		padding:"25px",
		background:"#f5f7fb",
		minHeight:"100vh"
	},

	header:{
		display:"flex",
		justifyContent:"space-between",
		alignItems:"center",
		marginBottom:"20px"
	},

	refreshBtn:{
		padding:"8px 14px",
		borderRadius:"8px",
		cursor:"pointer"
	},

	kpiGrid:{
		display:"grid",
		gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",
		gap:"16px",
		marginBottom:"20px"
	},

  chartGrid:{
    display:"grid",
    gridTemplateColumns:"2fr 1fr",
    gridTemplateRows:"1fr 1fr",
    gap:"20px",
    marginTop:"20px"
  },

	card:{
		background:"#fff",
		padding:"16px",
		borderRadius:"10px",
		boxShadow:"0 4px 10px rgba(0,0,0,0.08)"
	},

	tableCard:{
		background:"#fff",
		padding:"16px",
		borderRadius:"10px",
		boxShadow:"0 4px 10px rgba(0,0,0,0.08)"
	},

	table:{
		width:"100%",
		borderCollapse:"collapse"
	},

	approveBtn:{
		background:"#2563eb",
		color:"#fff",
		border:"none",
		padding:"6px 10px",
		borderRadius:"6px",
		cursor:"pointer"
	},

	rejectBtn:{
		background:"#dc2626",
		color:"#fff",
		border:"none",
		padding:"6px 10px",
		borderRadius:"6px",
		cursor:"pointer"
	},

  progressCard:{
    background:"#fff",
    padding:"16px",
    borderRadius:"10px",
    boxShadow:"0 4px 10px rgba(0,0,0,0.08)",
    textAlign:"center"
  },

  donut:{
    width:"120px",
    height:"120px",
    borderRadius:"50%",
    border:"14px solid #f59e0b",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    margin:"20px auto"
  },

  donutInner:{
    fontSize:"22px",
    fontWeight:"bold"
  },

  progressText:{
    fontSize:"12px",
    color:"#777",
    marginBottom:"10px"
  },

  orangeBtn:{
    background:"#f59e0b",
    border:"none",
    color:"#fff",
    padding:"8px 12px",
    borderRadius:"6px",
    cursor:"pointer"
  },

  topCards:{
    display:"grid",
    gridTemplateColumns:"repeat(4,1fr)",
    gap:"20px",
    marginBottom:"30px"
  },

  statCard:{
    padding:"18px",
    borderRadius:"10px",
    boxShadow:"0 6px 14px rgba(0,0,0,0.1)",
    height:"100%"
  },

  statTop:{
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center",
    fontSize:"14px",
    opacity:0.8
  },

  icon:{
    fontSize:"16px"
  },

  calendarCard:{
    background:"#fff",
    padding:"16px",
    borderRadius:"10px",
    boxShadow:"0 4px 10px rgba(0,0,0,0.08)"
  },

  sideWidgets:{
    display:"grid",
    gridTemplateRows:"auto auto",
    gap:"20px",
    alignContent:"start"
  },

};