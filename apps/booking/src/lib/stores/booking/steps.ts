import { getContext, setContext } from 'svelte';
import { derived, get, writable, type Writable } from 'svelte/store';

const STEPS_CONTEXT_KEY = Symbol('booking_steps');

/** Create a store to manage the booking steps (internal to the steps) */
const stepsStoreCtx = () => {
	const existing = getContext<Writable<BookingStep[]> | null>(STEPS_CONTEXT_KEY);
	if (existing) return existing;

	const store = writable<BookingStep[]>([]);
	setContext(STEPS_CONTEXT_KEY, store);
	return store;
};

/** Define a booking step */
export function defineStep<TValue, TName extends string>(
	options: BookingStepOptions<TName, TValue>
): BookingStep<TName, TValue> {
	const stepsStore = stepsStoreCtx();

	const getStepIdx = () => get(stepsStore).findIndex((s) => s.name === options.name);
	const getNextStep = () => get(stepsStore)[getStepIdx() + 1] as BookingStep | undefined;
	const getPreviousStep = () => get(stepsStore)[getStepIdx() - 1] as BookingStep | undefined;

	const step: BookingStep<TName, TValue> = {
		name: options.name,
		status: writable<GenericStatus>('default'),
		open: writable<boolean>(false),
		value: options.valueStore,
		summary: derived(options.valueStore, (v) => options.summaryFunction?.(v) || ''),

		onComplete: () => {
			if (!get(step.value)) return;

			step.status.set('success');
			getNextStep()?.onOpen();
		},

		onOpen: () => {
			const prevStep = getPreviousStep();
			const prevStepSuccess = prevStep ? get(prevStep.status) === 'success' : true;
			if (!prevStepSuccess) return;

			get(stepsStore).forEach((s) => {
				if (s.name !== options.name) s.open.set(false);
			});
			step.open.set(true);
		},

		onGoBack: () => getPreviousStep()?.onOpen()
	};

	stepsStore.update((steps) => [...steps, step]);
	return step;
}
