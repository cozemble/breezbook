<script lang="ts">
	import Step from './Step.svelte';
	import DetailsStep from './DetailsStep.svelte';
	import ExtrasStep from './ExtrasStep.svelte';
	import PickTimeStep from './PickTimeStep.svelte';

	interface IStep {
		name: 'time' | 'extras' | 'details';
		label: string;
		status: GenericStatus;
		summary: string;
		open: boolean;
		onComplete: () => void;
		onOpen: () => void;
	}

	const timeStep: IStep = {
		name: 'time',
		label: 'Pick a time',
		status: 'default',
		summary: '',
		open: true,
		onComplete: () => {
			if (!values.time) return;

			timeStep.status = 'success';
			extrasStep.onOpen();
		},
		onOpen: () => {
			timeStep.open = true;
			extrasStep.open = false;
			detailsStep.open = false;
		}
	};

	const extrasStep: IStep = {
		name: 'extras',
		label: 'Extras',
		status: 'default',
		summary: '',
		open: false,
		onComplete: () => {
			if (!values.extras) return;

			extrasStep.status = 'success';
			detailsStep.onOpen();
		},
		onOpen: () => {
			if (timeStep.status !== 'success') return;

			extrasStep.open = true;
			timeStep.open = false;
			detailsStep.open = false;
		}
	};

	const detailsStep: IStep = {
		name: 'details',
		label: 'Details',
		status: 'default',
		summary: '',
		open: false,
		onComplete: () => {
			if (!values.details) return;

			detailsStep.open = false;
			detailsStep.status = 'success';
		},
		onOpen: () => {
			if (extrasStep.status !== 'success') return;

			detailsStep.open = true;
			timeStep.open = false;
			extrasStep.open = false;
		}
	};

	//

	const values: {
		time: TimeSlot | null;
		extras: Service.Extra[] | null;
		details: Service.Details | null;
	} = {
		time: null,
		extras: null,
		details: null
	};

	// <!-- TODO properly format the value -->
	$: timeStep.summary = values.time
		? `${values.time.day.toLocaleDateString('en-GB', {
				weekday: 'short',
				day: 'numeric',
				month: 'short'
		  })} ${values.time.start} - ${values.time.end}`
		: '';
	$: extrasStep.summary = `${values.extras?.length || 'no'} extras selected`;
</script>

<!-- 
	@component
	Booking steps as an accordion.
 -->

<Step
	label={timeStep.label}
	status={timeStep.status}
	summary={timeStep.summary}
	open={timeStep.open}
	onOpen={timeStep.onOpen}
	action={{
		label: 'Next',
		disabled: !values.time,
		handle: () => {
			timeStep.onComplete();
		}
	}}
>
	<PickTimeStep bind:value={values.time} />
</Step>

<Step
	label={extrasStep.label}
	status={extrasStep.status}
	summary={extrasStep.summary}
	open={extrasStep.open}
	onOpen={extrasStep.onOpen}
	action={{
		label: 'Next',
		disabled: !values.extras,
		handle: () => {
			extrasStep.onComplete();
		}
	}}
	back={{
		label: 'Back',
		handle: () => {
			timeStep.onOpen();
		}
	}}
>
	<ExtrasStep bind:value={values.extras} />
</Step>

<Step
	label={detailsStep.label}
	status={detailsStep.status}
	summary={detailsStep.summary}
	open={detailsStep.open}
	onOpen={detailsStep.onOpen}
	action={{
		label: 'Complete',
		disabled: !values.details,
		handle: () => {
			detailsStep.onComplete();
		}
	}}
	back={{
		label: 'Back',
		handle: () => {
			extrasStep.onOpen();
		}
	}}
>
	<DetailsStep bind:value={values.details} />
</Step>
