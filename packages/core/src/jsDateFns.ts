export const jsDateFns = {
	hoursUntil(from: Date, to: Date) {
		return Math.floor((to.getTime() - from.getTime()) / 1000 / 60 / 60);
	},
	addHours(date: Date, hours: number) {
		return new Date(date.getTime() + hours * 1000 * 60 * 60);
	},
	differenceInMinutes(now: Date, time: Date) {
		return Math.floor((now.getTime() - time.getTime()) / 1000 / 60);
	},
	isBefore(date: Date, other: Date) {
		return date < other;
	},
	isAfter(date: Date, other: Date) {
		return date > other;
	}
};
