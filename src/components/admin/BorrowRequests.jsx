import { useEffect, useMemo, useState } from "react";
import { getUser } from "../services/authService";
import {
  getBorrowRequests,
  getBorrowRequestItems,
  setBorrowRequestStatus,
  returnBorrowRequest,
} from "../../helper/api";

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

export default function BorrowRequests() {
  const user = getUser();

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

  const handleSetStatus = async (reqId, status) => {
    setMessage("");

    if (!Number.isInteger(actorId) || actorId <= 0) {
      return setMessage("You must be logged in as admin to perform this action.");
    }

    try {
      await setBorrowRequestStatus(reqId, { status, user_id: actorId });
      setMessage(`✅ Request ${status}.`);
      await loadRequests();

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
    <div style={{ width: "100%" }}>
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
              border: "1px solid #dadce0",
              fontWeight: 600,
            }}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="returned">Returned</option>
          </select>

          <button style={btn} onClick={loadRequests} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {message && (
        <div style={{ marginBottom: 12, fontWeight: 600, opacity: 0.95 }}>
          {message}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: selectedRequest ? "1fr 420px" : "1fr",
          gap: 14,
          alignItems: "start",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
            overflow: "hidden",
            boxShadow: "0 6px 18px rgba(13,71,161,0.12)",
          }}
        >
          <thead>
            <tr>
              {["ID", "Student ID", "Status", "Borrow Date", "Return Date", "Created At"].map((h) => (
                <th key={h} style={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 15, textAlign: "center" }}>
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
                      background: isSelected ? "#dbe7f7" : "white",
                      transition: "background 0.2s ease",
                    }}
                  >
                    <td style={td}>{r.id}</td>
                    <td style={td}>{r.student_id}</td>
                    <td style={td}>{r.status}</td>
                    <td style={td}>{String(r.borrow_date || "").slice(0, 10)}</td>
                    <td style={td}>{String(r.return_date || "").slice(0, 10)}</td>
                    <td style={td}>{String(r.created_at || "").replace("T", " ").slice(0, 19)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {selectedRequest && (
          <div
            style={{
              border: "1px solid #e0e6ef",
              borderRadius: 12,
              padding: 14,
              background: "#fff",
              boxShadow: "0 6px 18px rgba(13,71,161,0.08)",
              position: "sticky",
              top: 90,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>Request #{selectedRequest.id}</div>
                <div style={{ opacity: 0.8, marginTop: 2 }}>
                  Student: <span style={{ fontWeight: 800 }}>{selectedRequest.student_id}</span>
                </div>
                <div style={{ opacity: 0.8, marginTop: 2 }}>
                  Status: <span style={{ fontWeight: 800 }}>{selectedRequest.status}</span>
                </div>
              </div>

              <button
                style={btn}
                onClick={() => {
                  setSelectedRequest(null);
                  setSelectedItems([]);
                  setConditionNotes("");
                }}
              >
                Close
              </button>
            </div>

            <hr style={{ borderColor: "#e0e6ef", margin: "12px 0" }} />

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
                      border: "1px solid #e0e6ef",
                      background: "#f8fbff",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>{it.item_name}</div>
                    <div style={{ opacity: 0.8, marginTop: 2, fontSize: 13 }}>
                      Code: <span style={{ fontWeight: 700 }}>{it.item_code}</span>
                      {it.category ? (
                        <>
                          {" "}• Category: <span style={{ fontWeight: 700 }}>{it.category}</span>
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
                      border: "1px solid #dadce0",
                      padding: 10,
                      resize: "vertical",
                      fontFamily: "inherit",
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
    </div>
  );
}
