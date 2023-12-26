<script lang="ts">
    let selectedCarWash = "smallCarWash";
    let fromDate = new Date()
</script>
<div>
    <form>
        <select bind:value={selectedCarWash}>
            <option value="smallCarWash" selected={selectedCarWash ==="smallCarWash"}>Small Car Wash</option>
            <option value="mediumCarWash" selected={selectedCarWash ==="mediumCarWash"}>Medium Car Wash</option>
            <option value="largeCarWash" selected={selectedCarWash ==="largeCarWash"}>Large Car Wash</option>
        </select>
        <button type="submit">Submit</button>
    </form>
</div>