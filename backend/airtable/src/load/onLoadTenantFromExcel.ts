import express from "express";
import {
    asHandler,
    EndpointDependencies,
    EndpointOutcome,
    expressBridge,
    httpResponseOutcome,
    postedFile,
    productionDeps
} from "../infra/endpoint.js";
import {PostedFile, RequestContext} from "../infra/http/expressHttp4t.js";
import {responseOf} from "@breezbook/packages-http/dist/responses.js";

export async function onLoadTenantFromExcel(req: express.Request, res: express.Response): Promise<void> {
    await expressBridge(productionDeps, onLoadTenantFromExcelEndpoint, req, res)
}

async function onLoadTenantFromExcelEndpoint(deps: EndpointDependencies, request: RequestContext): Promise<EndpointOutcome[]> {
    return asHandler(deps, request).withOneRequestParam(postedFile('file'), loadTenantFromExcel)
}

async function loadTenantFromExcel(deps: EndpointDependencies, file: PostedFile): Promise<EndpointOutcome[]> {
    console.log({file})
    return [httpResponseOutcome(responseOf(200, 'OK'))]
}
