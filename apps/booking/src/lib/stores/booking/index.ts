import { initSteps } from './steps';

export function createBookingStore(service: Service) {
	const steps = initSteps();

	return {
		steps
	};
}
