#!/usr/bin/env node
import { Command } from 'commander';
import { generateSvelteComponent } from './generator';

const program = new Command();

program
    .name('generate-svelte')
    .description('CLI to generate Svelte components')
    .version('0.1.0');

program
    .argument('<name>', 'name of the component to generate')
    .option('-d, --directory <directory>', 'directory to create the component in', 'src/lib/components')
    .action(async (name, options) => {
        try {
            await generateSvelteComponent(name, options.directory);
            console.log(`Component ${name} created successfully in ${options.directory}`);
        } catch (error) {
            console.error('Error generating component:', error);
        }
    });

program.parse(process.argv);