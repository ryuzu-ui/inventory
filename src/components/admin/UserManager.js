import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useTheme } from "../../context/ThemeContext";

/* TABLE STYLES (same as inventory) */
const th = {
	padding: "14px",
	border: "1px solid #cfd8e3",
	fontWeight: "600",
	fontSize: "14px",
	textAlign: "center",
	background: "#0d47a1",
	color: "white",
	whiteSpace: "nowrap"
};

const td = {
	padding: "11px",
	border: "1px solid #e0e6ef",
	fontSize: "13.5px",
	textAlign: "center",
	color: "#102a43"
};

export default function UserManager() {
	const { theme, themeName } = useTheme();

	const [users, setUsers] = useState([]);
	const [selectedIds, setSelectedIds] = useState([]);

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");

	/* LOAD USERS */
	const loadUsers = async () => {
		const { data, error } = await supabase
            .from("users")
            .select(`
                *,
                roles (id, name)
            `)
            .order("id", { ascending: false });
		if (error) {
			alert(error.message);
			return;
		}

		setUsers(data);
	};

	useEffect(() => {
		loadUsers();
	}, []);

	/* ADD USER */
	const addUser = async () => {
		if (!name || !email) return alert("Fill all fields");

		await supabase.from("users").insert([
			{
				full_name: name,
				email: email,
				password_hash: "temp123"
			}
		]);

		setName("");
		setEmail("");
		loadUsers();
	};

	/* DELETE USERS */
	const deleteSelected = async () => {
		if (selectedIds.length === 0) return;

		if (!window.confirm("Delete selected users?")) return;

		for (const id of selectedIds) {
			await supabase.from("users").delete().eq("id", id);
		}

		setSelectedIds([]);
		loadUsers();
	};

	const toggleSelect = (id) => {
		setSelectedIds(prev =>
			prev.includes(id)
				? prev.filter(x => x !== id)
				: [...prev, id]
		);
	};

	const tdTheme = {
		...td,
		color: theme.text,
		border: `1px solid ${theme.border}`,
	};

	return (
		<div style={{ width: "100%", color: theme.text }}>

			{/* 🔹 TOP BAR */}
			<div style={{
				display: "flex",
				justifyContent: "space-between",
				marginBottom: "12px",
				gap: "10px",
				flexWrap: "wrap"
			}}>
				{/* INPUTS */}
				<div style={{ display: "flex", gap: "8px" }}>
					<input
						placeholder="Full Name"
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
					<input
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
					<button onClick={addUser}>+ Add</button>
				</div>

				{/* DELETE */}
				<button
					disabled={selectedIds.length === 0}
					onClick={deleteSelected}
					style={{
						background: selectedIds.length === 0 ? "#ccc" : "#d93025",
						color: "white",
						border: "none",
						padding: "8px 16px",
						borderRadius: "6px",
						cursor: selectedIds.length === 0 ? "not-allowed" : "pointer"
					}}
				>
					Delete
				</button>
			</div>

			{/* 🔹 TABLE */}
			<div style={{
				width: "100%",
				overflowX: "auto",
				background: theme.card,
				borderRadius: "12px"
			}}>
				<table style={{
					width: "100%",
					borderCollapse: "collapse",
					background: theme.card,
					color: theme.text
				}}>
					<thead>
						<tr>
							<th style={th}>Select</th>
							<th style={th}>Name</th>
							<th style={th}>Email</th>
							<th style={th}>Role</th>
						</tr>
					</thead>

					<tbody>
						{users.length === 0 ? (
							<tr>
								<td colSpan="5" style={{ padding: "15px", textAlign: "center" }}>
									No users found
								</td>
							</tr>
						) : (
							users.map((u, i) => (
								<tr key={u.id}>
									<td style={tdTheme}>
										<input
											type="checkbox"
											checked={selectedIds.includes(u.id)}
											onChange={() => toggleSelect(u.id)}
										/>
									</td>
									<td style={tdTheme}>{u.full_name}</td>
									<td style={tdTheme}>{u.email}</td>
									<td style={tdTheme}>
                                        {u.role_id === 1 ? "Admin" : u.role_id === 2 ? "User" : "-"}
                                    </td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}