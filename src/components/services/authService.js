const USERS = [
	{
		id: "admin-001",
		username: "admin",
		password: "admin123",
		role: "admin"
	},

	{
		id: "stu-001",
		username: "studentA",
		password: "1234",
		role: "student",
		section: "BSHM-2A",
		schedule: {
			day: "Saturday",
			time: "08:00-10:00"
		}
	},

	{
		id: "stu-002",
		username: "studentB",
		password: "1234",
		role: "student",
		section: "BSHM-2A",
		schedule: {
			day: "Saturday",
			time: "11:00-13:00"
		}
	}
];

export function login(username, password) {
	const user = USERS.find(
		u => u.username === username && u.password === password
	);

	if (!user) return null;

	localStorage.setItem("user", JSON.stringify(user));
	return user;
}

export function getUser() {
	return JSON.parse(localStorage.getItem("user"));
}

export function logout() {
	localStorage.removeItem("user");
}
