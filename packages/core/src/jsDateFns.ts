export const jsDateFns = {
	hoursUntil(from: Date, to: Date) {
		return Math.floor((to.getTime() - from.getTime()) / 1000 / 60 / 60);
	}
};
