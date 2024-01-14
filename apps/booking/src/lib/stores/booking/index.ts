import { derived, get, writable } from 'svelte/store';

// TODO init with service

// TODO each steps

// TODO time step
// TODO extras step
// TODO details step
// TODO custom steps as JSON Schema

// TODO steps fetch data
// TODO steps validate and submit

export function createBookingStore(service: Service) {
	const stepsStore = writable<BookingStep[]>([]);

	function defineStep<TName extends string, TValue>(
		options: BookingStepOptions<TName, TValue>
	): BookingStep<TName, TValue> {
		const open = writable<boolean>(false);
		const status = writable<GenericStatus>('default');
		const value = writable<TValue>(options.initialValue);
		const summary = writable<string>('');

		const indexOfStep = derived(stepsStore, (steps) =>
			steps.findIndex((s) => s.name === options.name)
		);

		/** Check for the value, then set the status to success and open the next step */
		function onComplete() {
			if (!get(value)) return;

			status.set('success');
			get(stepsStore)?.[get(indexOfStep) + 1].onOpen();
		}

		/** Open the step if the previous step is completed */
		function onOpen() {
			const previousStep = get(stepsStore)?.[get(indexOfStep) - 1];

			if (previousStep && get(previousStep.status) !== 'success') return;

			get(stepsStore).forEach((s) => {
				if (s.name === options.name) s.open.set(true);
				else s.open.set(false);
			});
		}

		/** Open the previous step */
		function onGoBack() {
			get(stepsStore).forEach((s, i) => {
				if (i === get(indexOfStep) - 1) s.onOpen();
			});
		}

		const step = {
			name: options.name,
			status,
			open,
			value,
			summary,
			onComplete,
			onOpen,
			onGoBack
		};

		stepsStore.update((steps) => [...steps, step]);
		return step;
	}

	const steps = {
		timeStep: defineStep({
			name: 'time',
			initialValue: null as TimeSlot | null
		}),
		extrasStep: defineStep({
			name: 'extras',
			initialValue: [] as Service.Extra[]
		}),
		detailsStep: defineStep({
			name: 'details',
			initialValue: null as Service.Details | null
		})
		// TODO custom steps
	};

	return {
		steps
	};
}

// need to define steps in an array so we can keep track of the order
// need to define steps individually so we can make components for them with proper type safety
// best solution seems to be to define steps individually, then add them to an array store
