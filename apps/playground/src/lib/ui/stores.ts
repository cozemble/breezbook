import {derived, writable} from 'svelte/store';
import {translationsFor} from "$lib/lang/translations";

export const language = writable('en');

export const translations = derived(language, translationsFor);

language.subscribe(l => console.log('Language changed to', l))