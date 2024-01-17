import { get, writable, type Writable } from 'svelte/store';

function defineStep<TValue, TName extends string>(
	options: BookingStepOptions<TName, TValue>,
	stepsStore: Writable<BookingStep[]>
): BookingStep<TName, TValue> {
	const open = writable<boolean>(false);
	const status = writable<GenericStatus>('default');
	const value = writable<TValue | null>(options.initialValue || null);
	const summary = writable<string>('');

	const getStepIdx = () => get(stepsStore).findIndex((s) => s.name === options.name);

	// Update the summary when the value changes
	if (options.summaryFunction) {
		value.subscribe((v) => {
			const s = options.summaryFunction?.(v) || '';
			summary.set(s);
		});
	}

	const step: BookingStep<TName, TValue> = {
		name: options.name,
		status,
		open,
		value,
		summary,
		onComplete: () => {
			if (!get(value)) return;

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

/** Set up the steps for the booking process */
export function initSteps() {
	const stepsStore = writable<BookingStep[]>([]);

	const steps = {
		timeStep: defineStep<TimeSlot, 'time'>(
			{
				name: 'time',
				summaryFunction: (value) =>
					value
						? `${value.day.toLocaleDateString('en-GB', {
								weekday: 'short',
								day: 'numeric',
								month: 'short'
						  })} ${value.start} - ${value.end}`
						: 'no time slot selected'
			},
			stepsStore
		),

		extrasStep: defineStep(
			{
				name: 'extras',
				initialValue: [] as Service.Extra[],
				summaryFunction: (value) => `${value?.length || 'no'} extras selected`
			},
			stepsStore
		),

		detailsStep: defineStep(
			{
				name: 'details',
				initialValue: null as Service.Details | null
			},
			stepsStore
		)
		// TODO custom steps
	};

	// Open the first step
	get(stepsStore)?.[0].onOpen();

	return steps;
}
