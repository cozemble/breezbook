import {writable, type Writable} from "svelte/store";

export let navState: Writable<{ [key: string]: string }> = writable({
    language: "English",
    theme: "emerald",
    location: "Harlow"
});
