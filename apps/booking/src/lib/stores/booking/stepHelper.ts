import { getContext, setContext } from 'svelte';
import { derived, get, readable, writable, type Writable } from 'svelte/store';

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
 * - Names must be unique (throws error if not)
 */
export function defineStep<TValue, TName extends string>(
	options: BookingStepOptions<TName, TValue>
): BookingStep<TName, TValue> {
	const stepsStore = stepsStoreCtx();

	// check if name already exists
	const nameExists = get(stepsStore).some((s) => s.name === options.name);
	if (nameExists)
		throw new Error(`Step with name ${options.name} already exists, names must be unique`);

	const getStepIdx = () => get(stepsStore).findIndex((s) => s.name === options.name);
	const getNextStep = () => get(stepsStore)[getStepIdx() + 1] as BookingStep | undefined;
	const getPreviousStep = () => get(stepsStore)[getStepIdx() - 1] as BookingStep | undefined;
	const isPrevStepSuccess = () => {
		const prevStep = getPreviousStep();
		const prevStepSuccess = prevStep ? get(prevStep.status) === 'success' : true;
		return prevStepSuccess;
	};
	const isFirst = !get(stepsStore).length;

	const step: BookingStep<TName, TValue> = {
		name: options.name,
		status: writable<GenericStatus>('default'),
		open: writable<boolean>(isFirst), // open the first step by default
		summary: derived(options.valueStore, (v) => options.summaryFunction?.(v) || ''),
		available: writable<boolean>(isFirst),
		onComplete: () => {
			step.status.set('success');
			getNextStep()?.available.set(true);
			getNextStep()?.onOpen();
		},

		onOpen: () => {
			if (!isPrevStepSuccess()) return;

			get(stepsStore).forEach((s) => {
				if (s.name !== options.name) s.open.set(false);
				else s.open.set(true);
			});
		},

		onGoBack: () => getPreviousStep()?.onOpen()
	};

	// add the step to the store to access it later
	stepsStore.update((steps) => [...steps, step]);

	return step;
}
