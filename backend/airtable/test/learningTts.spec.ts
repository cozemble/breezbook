import {test} from 'vitest'
import fs from 'fs';
import path from "path";
import * as dotenv from 'dotenv'
import OpenAI from "openai";


dotenv.config()
const openai = new OpenAI();

test("learning", async () => {

    const speechFile = path.resolve("./speech.mp3");
    const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "onyx",
        input: "Today is a wonderful day to build something people love!",
    });
    console.log(speechFile);
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(speechFile, buffer);
}, {timeout: 10000})