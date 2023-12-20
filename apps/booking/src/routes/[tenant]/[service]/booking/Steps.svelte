<script lang="ts">
	import AccordionItem from '$lib/components/AccordionItem.svelte';
	import DetailsStep from './DetailsStep.svelte';
	import ExtrasStep from './ExtrasStep.svelte';
	import PickTimeStep from './PickTimeStep.svelte';

	// <!-- TODO clean this mess up -->

	interface Step {
		name: 'time' | 'extras' | 'details';
		label: string;
		status: GenericStatus;
		summary: string;
		component: typeof DetailsStep | typeof ExtrasStep | typeof PickTimeStep;
		open: boolean;
		onComplete: () => void;
		// value: (typeof values)[Step['name']];
	}

	const values: {
		time: TimeSlot | null;
		extras: Service.Extra[] | null;
		details: Service.Details | null;
	} = {
		time: null,
		extras: null,
		details: null
	};

	const timeStep: Step = {
		name: 'time',
		label: 'Pick a time',
		status: 'default',
		summary: '',
		component: PickTimeStep,
		open: true,
		onComplete: () => {
			timeStep.open = false;
			timeStep.status = 'success';
			extrasStep.open = true;
			timeStep.summary = 'Wed, 11 Dec 14:00 - 17:00'; // <!-- TODO properly format the value -->
		}
	};

	const extrasStep: Step = {
		name: 'extras',
		label: 'Extras',
		status: 'default',
		summary: '',
		component: ExtrasStep,
		open: false,
		onComplete: () => {
			extrasStep.open = false;
			extrasStep.status = 'success';
			detailsStep.open = true;
			extrasStep.summary = `${values.extras?.length || 0} extras selected`;
		}
	};

	const detailsStep: Step = {
		name: 'details',
		label: 'Details',
		status: 'default',
		summary: '',
		component: DetailsStep,
		open: false,
		onComplete: () => {
			detailsStep.open = false;
			detailsStep.status = 'success';
		}
	};
</script>

<!-- TODO open the next step when the previous is done -->
<!-- TODO the form logic -->
<!-- TODO step data change based on other steps -->

<AccordionItem
	open={timeStep.open}
	label={timeStep.label}
	status={timeStep.status}
	collapsedDetails={timeStep.summary}
	action={{
		label: 'Next',
		disabled: !values.time,
		handle: () => {
			timeStep.onComplete();
		}
	}}
>
	<PickTimeStep
		onComplete={() => {
			timeStep.onComplete();
		}}
		bind:value={values.time}
	/>
</AccordionItem>

<AccordionItem
	open={extrasStep.open}
	label={extrasStep.label}
	status={extrasStep.status}
	collapsedDetails={extrasStep.summary}
	action={{
		label: 'Next',
		disabled: !values.extras,
		handle: () => {
			extrasStep.onComplete();
		}
	}}
>
	<ExtrasStep bind:value={values.extras} />
</AccordionItem>

<AccordionItem
	open={detailsStep.open}
	label={detailsStep.label}
	status={detailsStep.status}
	collapsedDetails={detailsStep.summary}
	action={{
		label: 'Complete',
		disabled: !values.details,
		handle: () => {
			detailsStep.onComplete();
		}
	}}
>
	<DetailsStep bind:value={values.details} />
</AccordionItem>
