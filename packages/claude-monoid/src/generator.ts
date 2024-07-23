import { config } from 'dotenv';
import { Anthropic } from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';
import * as path from 'path';
import readline from 'readline';

config();

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ConversationState {
    componentName: string;
    currentCode: string;
    history: string[];
    versionHistory: string[];
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query: string): Promise<string> {
    return new Promise((resolve) => rl.question(query, resolve));
}

export async function generateSvelteComponent(name: string, directory: string): Promise<void> {
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not set in the environment variables');
    }

    const fullPath = path.join(process.cwd(), directory, `${name}.svelte`);

    let initialCode = '';
    let isExisting = false;

    try {
        initialCode = await fs.readFile(fullPath, 'utf-8');
        isExisting = true;
        console.log(`Existing component '${name}' found. Loading its content.`);
    } catch (error) {
        console.log(`No existing component '${name}' found. Creating a new one.`);
        initialCode = `
    <script lang="ts">
        
    </script>
    
    <div>
    <!-- view and view logic for the component -->
    </div>
    
    <style>
    <!-- styles for the component -->
    </style>
    `;
    }

    let state: ConversationState = {
        componentName: name,
        currentCode: initialCode,
        history: isExisting ? [`Existing component loaded: ${name}`] : [],
        versionHistory: [initialCode]
    };

    if (!isExisting) {
        state = await generateOrUpdateComponent(state, 'Create initial component');
        await writeComponentToDisk(fullPath, state.currentCode);
    }

    while (true) {
        console.log('\nCurrent component code:');
        console.log(state.currentCode);
        console.log(`\nComponent has been updated at ${fullPath}`);

        const userInput = await askQuestion('\nEnter your amendment request (or type "done" to finish, "undo" to revert last change): ');

        if (userInput.toLowerCase() === 'done') {
            break;
        } else if (userInput.toLowerCase() === 'undo') {
            if (state.versionHistory.length > 1) {
                state.versionHistory.pop(); // Remove the current version
                state.currentCode = state.versionHistory[state.versionHistory.length - 1];
                state.history.push('Undo last change');
                await writeComponentToDisk(fullPath, state.currentCode);
                console.log('Undone last change.');
            } else {
                console.log('Cannot undo. No previous versions available.');
            }
        } else {
            state = await generateOrUpdateComponent(state, userInput);
            await writeComponentToDisk(fullPath, state.currentCode);
        }
    }

    console.log(`\nComponent ${state.componentName} has been finalized at ${fullPath}`);
    rl.close();
}

async function generateOrUpdateComponent(state: ConversationState, input: string): Promise<ConversationState> {
    const prompt = `
    ${state.history.join('\n')}
    Current Svelte component named ${state.componentName}:
    ${state.currentCode}

    User request: ${input}

    Please update the Svelte component based on the user's request. Return ONLY the updated Svelte code, without any explanations or additional text. Your response will be handed straight to the svelte compiler. Use TypeScript in the component.
    `;

    const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4096,
        temperature: 0.7,
        messages: [
            { role: 'user', content: prompt }
        ]
    });

    const first = response.content[0];
    if (first.type !== 'text') {
        throw new Error(`Unexpected response type`);
    }

    const newCode = extractSvelteCode(first.text);
    state.currentCode = newCode;
    state.history.push(input);
    state.versionHistory.push(newCode);

    return state;
}

function extractSvelteCode(text: string): string {
    const svelteComponentRegex = /<script[\s\S]*?<\/script>[\s\S]*?<style[\s\S]*?<\/style>/;
    const match = text.match(svelteComponentRegex);

    if (match) {
        return match[0].trim();
    } else {
        return text.trim();
    }
}

async function writeComponentToDisk(filePath: string, content: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
}