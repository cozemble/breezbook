import { goto } from '$app/navigation';
import { getContext, setContext } from 'svelte';
import { type Writable, get, writable } from 'svelte/store';

const STEPS_CONTEXT_KEY = Symbol('booking_steps');

/** Create or get the store to manage the booking steps */
const stepsStoreCtx = () => {
	const existing = getContext<Writable<BookingStep[]> | null>(STEPS_CONTEXT_KEY);
	if (existing) return existing;

	const store = writable<BookingStep[]>([]);
	setContext(STEPS_CONTEXT_KEY, store);
	return store;
};

/** Define a booking step
 * - Handles all the logic related to the step automatically
 * - #### Define the steps in the order you want them to be displayed
 */
export function defineStep(id: string): BookingStep {
	const stepsStore = stepsStoreCtx();

	const isFirst = !get(stepsStore).length;

	const getStepIdx = () => get(stepsStore).findIndex((s) => s.id === id);
	const getNextStep = () => get(stepsStore)[getStepIdx() + 1] as BookingStep | undefined;
	const getPreviousStep = () => get(stepsStore)[getStepIdx() - 1] as BookingStep | undefined;
	const isPrevStepSuccess = () => {
		const prevStep = getPreviousStep();
		const prevStepSuccess = prevStep ? get(prevStep.status) === 'success' : true;
		return prevStepSuccess;
	};

	const step: BookingStep = {
		id,
		status: writable<GenericStatus>('default'),
		open: writable<boolean>(isFirst), // open the first step by default
		available: writable<boolean>(isFirst),

		onComplete: () => {
			step.status.set('success');
			getNextStep()?.available.set(true);
			getNextStep()?.onOpen();
		},

		onOpen: () => {
			if (!isPrevStepSuccess()) return;

			// scroll to the top if on mobile
			// scroll to the step if on desktop
			if (window.innerWidth < 768) window.scrollTo({ top: 0, behavior: 'smooth' });
			else goto(`#${id}`);

			get(stepsStore).forEach((s) => {
				if (s.id !== id) s.open.set(false);
				else s.open.set(true);
			});
		},

		onGoBack: () => getPreviousStep()?.onOpen()
	};

	// add the step to the store to access it later
	stepsStore.update((steps) => [...steps, step]);

	return step;
}
