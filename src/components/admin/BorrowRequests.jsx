import { useEffect, useMemo, useState } from "react";
import { getUser } from "../services/authService";
import { useTheme } from "../../context/ThemeContext";
import {
  getBorrowRequests,
  getBorrowRequestItems,
  setBorrowRequestStatus,
  returnBorrowRequest,
} from "../../helper/api";

function formatDateTime12(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return String(value);
  }
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const th = {
  padding: "14px",
  border: "1px solid #cfd8e3",
  fontWeight: "600",
  fontSize: "14px",
  textAlign: "center",
  background: "#0d47a1",
  color: "#fff",
  whiteSpace: "nowrap",
};

const td = {
  padding: "12px",
  border: "1px solid #e0e6ef",
  fontSize: "13.5px",
  textAlign: "center",
  color: "#102a43",
  background: "#fff",
};

const btn = {
  padding: "8px 12px",
  borderRadius: "6px",
  border: "1px solid #dadce0",
  background: "#f1f3f4",
  cursor: "pointer",
  fontSize: "12px",
};

const btnApprove = {
  ...btn,
  border: "none",
  background: "#2e7d32",
  color: "white",
  fontWeight: 700,
};

const btnReject = {
  ...btn,
  border: "none",
  background: "#d93025",
  color: "white",
  fontWeight: 700,
};

const btnReturn = {
  ...btn,
  border: "none",
  background: "#0d47a1",
  color: "white",
  fontWeight: 700,
};

export default function BorrowRequests({ onInventoryChanged }) {
  const user = getUser();
	const { theme, themeName } = useTheme();
	const isDark = themeName === "dark";
	const [isMobile, setIsMobile] = useState(
		typeof window !== "undefined" ? window.innerWidth <= 768 : false
	);

	useEffect(() => {
		const onResize = () => setIsMobile(window.innerWidth <= 768);
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	const tdTheme = useMemo(() => {
		return {
			...td,
			background: theme.card,
			color: theme.text,
			border: `1px solid ${theme.border}`,
		};
	}, [theme.card, theme.text, theme.border]);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const [conditionNotes, setConditionNotes] = useState("");

  const actorId = useMemo(() => Number(user?.id), [user]);

  const loadRequests = async () => {
    setLoading(true);
    setMessage("");
    try {
      const data = await getBorrowRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("getBorrowRequests error:", e);
      setRequests([]);
      setMessage(e.message || "Failed to load borrow requests.");
    } finally {
      setLoading(false);
    }
  };

  const loadItemsForRequest = async (requestId) => {
    setLoadingItems(true);
    setMessage("");
    try {
      const data = await getBorrowRequestItems(requestId);
      setSelectedItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("getBorrowRequestItems error:", e);
      setSelectedItems([]);
      setMessage(e.message || "Failed to load request items.");
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRequests = useMemo(() => {
    if (statusFilter === "all") return requests;
    return requests.filter((r) => String(r.status || "").toLowerCase() === statusFilter);
  }, [requests, statusFilter]);

  const handleSelectRequest = async (reqRow) => {
    setSelectedRequest(reqRow);
    setConditionNotes("");
    await loadItemsForRequest(reqRow.id);
  };

	const closeSelected = () => {
		setSelectedRequest(null);
		setSelectedItems([]);
		setConditionNotes("");
	};

  const handleSetStatus = async (reqId, status) => {
    setMessage("");

    if (!Number.isInteger(actorId) || actorId <= 0) {
      return setMessage("You must be logged in as admin to perform this action.");
    }

    try {
      await setBorrowRequestStatus(reqId, { status, user_id: actorId });
      setMessage(`✅ Request ${status}.`);
      await loadRequests();

      if (typeof onInventoryChanged === "function" && status === "approved") {
        try {
          await onInventoryChanged();
        } catch {
          // ignore
        }
      }

      // refresh selected row
      const updatedSelected = requests.find((r) => r.id === reqId);
      if (updatedSelected) {
        setSelectedRequest(updatedSelected);
      }
    } catch (e) {
      console.error("setBorrowRequestStatus error:", e);
      setMessage(e.message || "Failed to update request status.");
    }
  };

  const handleReturn = async (reqId) => {
    setMessage("");

    if (!Number.isInteger(actorId) || actorId <= 0) {
      return setMessage("You must be logged in as admin to perform this action.");
    }

    try {
      await returnBorrowRequest(reqId, {
        user_id: actorId,
        condition_notes: conditionNotes,
      });
      setMessage("✅ Marked as returned.");
      setConditionNotes("");
      await loadRequests();

      if (typeof onInventoryChanged === "function") {
        try {
          await onInventoryChanged();
        } catch {
          // ignore
        }
      }

      // reload items panel (still useful to show what was returned)
      if (selectedRequest?.id === reqId) {
        await loadItemsForRequest(reqId);
      }
    } catch (e) {
      console.error("returnBorrowRequest error:", e);
      setMessage(e.message || "Failed to mark returned.");
    }
  };

  return (
    <div style={{ color: theme.text }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Borrow Requests</h2>
          <div style={{ opacity: 0.75, marginTop: 4, fontSize: 13 }}>
            Manage student borrow requests: approve, reject, and mark returned.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              fontWeight: 600,
			  background: theme.card,
			  color: theme.text,
            }}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="returned">Returned</option>
          </select>

          <button
			style={{ ...btn, background: theme.card, color: theme.text, border: `1px solid ${theme.border}` }}
			onClick={loadRequests}
			disabled={loading}
		  >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {message && (
        <div style={{ marginBottom: "12px", color: "#c62828" }}>{message}</div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: selectedRequest && !isMobile ? "1fr 420px" : "1fr",
          gap: 14,
          alignItems: "start",
        }}
      >
        <div style={{ overflowX: "auto", background: theme.card, borderRadius: "12px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  "ID",
                  "Student ID",
                  "Section",
                  "Status",
                  "Borrow Date",
                  "Return Date",
                  "Created At",
                ].map((h) => (
                  <th key={h} style={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 15, textAlign: "center" }}>
                    {loading ? "Loading…" : "No borrow requests found"}
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => {
                  const isSelected = selectedRequest?.id === r.id;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => handleSelectRequest(r)}
                      style={{
                        cursor: "pointer",
                        background: isSelected
                          ? isDark
                            ? "rgba(255,255,255,0.08)"
                            : "#dbe7f7"
                          : theme.card,
                        transition: "background 0.2s ease",
                      }}
                    >
                      <td style={tdTheme}>{r.id}</td>
                      <td style={tdTheme}>{r.student_school_id || r.student_id}</td>
                      <td style={tdTheme}>{r.student_section || "—"}</td>
                      <td style={tdTheme}>{r.status}</td>
                      <td style={tdTheme}>{String(r.borrow_date || "").slice(0, 10)}</td>
                      <td style={tdTheme}>
                        {String(r.status || "").toLowerCase() === "returned"
                          ? String(r.returned_at || "").slice(0, 10)
                          : "—"}
                      </td>
                      <td style={tdTheme}>{formatDateTime12(r.created_at)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      {/* Desktop-only right-side details panel */}
      {selectedRequest && !isMobile && (
        <div
          style={{
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
            padding: 14,
            background: theme.card,
            color: theme.text,
            boxShadow: "0 6px 18px rgba(13,71,161,0.08)",
            position: "sticky",
            top: 90,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Request #{selectedRequest.id}</div>
              <div style={{ opacity: 0.8, marginTop: 2 }}>
                Student: <span style={{ fontWeight: 800 }}>{selectedRequest.student_school_id || selectedRequest.student_id}</span>
              </div>
              <div style={{ opacity: 0.8, marginTop: 2 }}>
                Section: <span style={{ fontWeight: 800 }}>{selectedRequest.student_section || "—"}</span>
              </div>
              <div style={{ opacity: 0.8, marginTop: 2 }}>
                Status: <span style={{ fontWeight: 800 }}>{selectedRequest.status}</span>
              </div>
            </div>

            <button
              style={btn}
              onClick={closeSelected}
            >
              Close
            </button>
          </div>

          <hr style={{ borderColor: theme.border, margin: "12px 0" }} />

          <div style={{ fontWeight: 900, marginBottom: 10 }}>Items</div>

          {loadingItems ? (
            <div style={{ opacity: 0.8 }}>Loading…</div>
          ) : selectedItems.length === 0 ? (
            <div style={{ opacity: 0.8 }}>No items</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {selectedItems.map((it) => (
                <div
                  key={it.id}
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    border: `1px solid ${theme.border}`,
                    background: isDark ? "rgba(255,255,255,0.04)" : "#f8fbff",
                  }}
                >
                  <div style={{ fontWeight: 900 }}>{it.item_name}</div>
                  <div style={{ opacity: 0.8, marginTop: 2, fontSize: 13 }}>
                    Code: <span style={{ fontWeight: 700 }}>{it.item_code}</span>
                    {it.category ? (
                      <>
                        {" "}
                        • Category: <span style={{ fontWeight: 700 }}>{it.category}</span>
                      </>
                    ) : null}
                  </div>
                  <div style={{ marginTop: 6, fontWeight: 800 }}>Qty: {it.quantity}</div>
                </div>
              ))}
            </div>
          )}

          <hr style={{ borderColor: "#e0e6ef", margin: "12px 0" }} />

          {String(selectedRequest.status || "").toLowerCase() === "pending" && (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={btnApprove}
                onClick={() => handleSetStatus(selectedRequest.id, "approved")}
              >
                Approve
              </button>
              <button
                style={btnReject}
                onClick={() => handleSetStatus(selectedRequest.id, "rejected")}
              >
                Reject
              </button>
            </div>
          )}

          {String(selectedRequest.status || "").toLowerCase() === "approved" && (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ opacity: 0.85, fontWeight: 700 }}>Condition notes (optional)</label>
                <textarea
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    border: `1px solid ${theme.border}`,
                    padding: 10,
                    resize: "vertical",
                    fontFamily: "inherit",
                    background: isDark ? "rgba(255,255,255,0.06)" : "#ffffff",
                    color: theme.text,
                  }}
                />
              </div>

              <button
                style={btnReturn}
                onClick={() => handleReturn(selectedRequest.id)}
              >
                Mark Returned
              </button>
            </div>
          )}

          {String(selectedRequest.status || "").toLowerCase() === "returned" && (
            <div style={{ opacity: 0.8, fontWeight: 700 }}>
              This request is already marked as returned.
            </div>
          )}

          {String(selectedRequest.status || "").toLowerCase() === "rejected" && (
            <div style={{ opacity: 0.8, fontWeight: 700 }}>
              This request was rejected.
            </div>
          )}
        </div>
      )}
    </div>

		{/* Mobile-only modal details panel */}
		{selectedRequest && isMobile && (
			<div
				role="dialog"
				aria-modal="true"
				style={{
					position: "fixed",
					inset: 0,
					background: "rgba(0,0,0,0.55)",
					zIndex: 1000,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					padding: 12,
				}}
				onClick={closeSelected}
			>
				<div
					style={{
						width: "100%",
						maxWidth: 520,
						maxHeight: "86vh",
						overflow: "hidden",
						borderRadius: 14,
						background: theme.card,
						color: theme.text,
						border: `1px solid ${theme.border}`,
						boxShadow: isDark
							? "0 14px 40px rgba(0,0,0,0.55)"
							: "0 14px 40px rgba(0,0,0,0.20)",
						display: "flex",
						flexDirection: "column",
					}}
					onClick={(e) => e.stopPropagation()}
				>
					<div
						style={{
							padding: 14,
							display: "flex",
							justifyContent: "space-between",
							gap: 10,
							borderBottom: `1px solid ${theme.border}`,
						}}
					>
						<div>
							<div style={{ fontWeight: 900, fontSize: 16 }}>Request #{selectedRequest.id}</div>
							<div style={{ opacity: 0.85, marginTop: 2, fontSize: 13 }}>
								Student: <span style={{ fontWeight: 800 }}>{selectedRequest.student_school_id || selectedRequest.student_id}</span>
							</div>
							<div style={{ opacity: 0.85, marginTop: 2, fontSize: 13 }}>
								Section: <span style={{ fontWeight: 800 }}>{selectedRequest.student_section || "—"}</span>
							</div>
							<div style={{ opacity: 0.85, marginTop: 2, fontSize: 13 }}>
								Status: <span style={{ fontWeight: 800 }}>{selectedRequest.status}</span>
							</div>
						</div>
						<button style={btn} onClick={closeSelected}>Close</button>
					</div>

					<div style={{ padding: 14, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
						<div style={{ fontWeight: 900, marginBottom: 10 }}>Items</div>

						{loadingItems ? (
							<div style={{ opacity: 0.8 }}>Loading…</div>
						) : selectedItems.length === 0 ? (
							<div style={{ opacity: 0.8 }}>No items</div>
						) : (
							<div style={{ display: "grid", gap: 8 }}>
								{selectedItems.map((it) => (
									<div
										key={it.id}
										style={{
											padding: 10,
											borderRadius: 10,
											border: `1px solid ${theme.border}`,
											background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
										}}
									>
										<div style={{ fontWeight: 900 }}>{it.item_name}</div>
										<div style={{ opacity: 0.8, marginTop: 2, fontSize: 13 }}>
											Code: <span style={{ fontWeight: 700 }}>{it.item_code}</span>
											{it.category ? (
												<>
													{" "}
													• Category: <span style={{ fontWeight: 700 }}>{it.category}</span>
												</>
											) : null}
										</div>
										<div style={{ marginTop: 6, fontWeight: 800 }}>Qty: {it.quantity}</div>
									</div>
								))}
							</div>
						)}

						{String(selectedRequest.status || "").toLowerCase() === "approved" && (
							<div style={{ marginTop: 12, display: "grid", gap: 10 }}>
								<div style={{ display: "grid", gap: 6 }}>
									<label style={{ opacity: 0.85, fontWeight: 700 }}>Condition notes (optional)</label>
									<textarea
										value={conditionNotes}
										onChange={(e) => setConditionNotes(e.target.value)}
										rows={3}
										style={{
											width: "100%",
											borderRadius: 8,
											border: `1px solid ${theme.border}`,
											padding: 10,
											resize: "vertical",
											fontFamily: "inherit",
											background: isDark ? "rgba(255,255,255,0.06)" : "#ffffff",
											color: theme.text,
										}}
									/>
								</div>
							</div>
						)}
					</div>

					<div
						style={{
							padding: 14,
							display: "flex",
							gap: 8,
							borderTop: `1px solid ${theme.border}`,
							flexDirection:
								String(selectedRequest.status || "").toLowerCase() === "pending" ? "row" : "column",
						}}
					>
						{String(selectedRequest.status || "").toLowerCase() === "pending" && (
							<>
								<button
									style={{ ...btnApprove, flex: 1 }}
									onClick={() => handleSetStatus(selectedRequest.id, "approved")}
								>
									Approve
								</button>
								<button
									style={{ ...btnReject, flex: 1 }}
									onClick={() => handleSetStatus(selectedRequest.id, "rejected")}
								>
									Reject
								</button>
							</>
						)}

						{String(selectedRequest.status || "").toLowerCase() === "approved" && (
							<button style={btnReturn} onClick={() => handleReturn(selectedRequest.id)}>
								Mark Returned
							</button>
						)}
					</div>
				</div>
			</div>
		)}
    </div>
  );
}
