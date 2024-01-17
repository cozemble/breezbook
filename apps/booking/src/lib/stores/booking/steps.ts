import { get, writable, type Writable } from 'svelte/store';

export function defineStep<TValue, TName extends string>(
	options: BookingStepOptions<TName, TValue>,
	stepsStore: Writable<BookingStep[]>
): BookingStep<TName, TValue> {
	const open = writable<boolean>(false);
	const status = writable<GenericStatus>('default');
	const summary = writable<string>('');

	const getStepIdx = () => get(stepsStore).findIndex((s) => s.name === options.name);

	// Update the summary when the value changes
	if (options.summaryFunction) {
		options.valueStore.subscribe((v) => {
			const s = options.summaryFunction?.(v) || '';
			summary.set(s);
		});
	}

	const step: BookingStep<TName, TValue> = {
		name: options.name,
		status,
		open,
		value: options.valueStore,
		summary,
		onComplete: () => {
			if (!get(step.value)) return;

			status.set('success');
			get(stepsStore)?.[getStepIdx() + 1].onOpen();
		},
		onOpen: () => {
			const previousStep = get(stepsStore)?.[getStepIdx() - 1];
			const previousStepSuccess = previousStep ? get(previousStep.status) === 'success' : true;
			if (!previousStepSuccess) return;

			get(stepsStore).forEach((s) => {
				if (s.name === options.name) s.open.set(true);
				else s.open.set(false);
			});
		},
		onGoBack: () =>
			get(stepsStore).forEach((s, i) => {
				if (i === getStepIdx() - 1) s.onOpen();
			})
	};

	stepsStore.update((steps) => [...steps, step]);
	return step;
}