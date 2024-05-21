import express from "express";
import {bodyAsJsonParam, ParamExtractor, withOneRequestParam} from "../../infra/functionalExpress.js";
import {prismaClient} from "../../prisma/client.js";
import {WaitlistRegistration} from "@breezbook/backend-api-types";
import {v4 as uuid} from 'uuid'

function waitlistRegistrationBody(): ParamExtractor<WaitlistRegistration | null> {
    return bodyAsJsonParam<WaitlistRegistration>('waitlist.registration');
}

export async function onWaitlistSignup(req: express.Request, res: express.Response): Promise<void> {
    await withOneRequestParam(req, res, waitlistRegistrationBody(), async (registration) => {
        const prisma = prismaClient();
        await prisma.prospects.create({
            data: {
                id: uuid(),
                email: registration.email,
                signup_method: 'waitlist'
            }
        });
        res.status(200).send()
    });
}
