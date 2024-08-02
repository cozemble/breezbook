<script>
    import {User, Calendar, CreditCard, Goal} from "lucide-svelte";

    export let trainerName = 'Mike';
    export let date = '2021-07-22';
    export let time = '09:30';
    export let cost = '£70';
    export let goal = 'Lose weight';
</script>

<div class="card bg-base-200 shadow-xl mb-4">
    <div class="card-body p-4">
        <h3 class="card-title text-lg mb-2">Booking Summary</h3>
        <ul class="space-y-2">
            <li class="flex items-center">
                <User />
                <span class="ml-2">{trainerName}</span>
            </li>
            <li class="flex items-center">
                <Calendar />
                <span class="ml-2">{date} @ {time}</span>
            </li>
            <li class="flex items-center">
                <Goal />
                <span class="ml-2">{goal}</span>
            </li>
            <li class="flex items-center">
                <CreditCard />
                <span class="ml-2">{cost}</span>
            </li>
        </ul>
    </div>
</div>