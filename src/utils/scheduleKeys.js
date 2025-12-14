export function getScheduleKey(user) {
	return `${user.schedule.day}_${user.schedule.time}_${user.schedule.section}`;
}
