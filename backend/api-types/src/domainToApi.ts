import * as core from "@breezbook/packages-core";
import {PriceBreakdown} from "./index.js";

export const domainToApi = {
    priceBreakdown: function (pb: core.PriceBreakdown): PriceBreakdown {
        return {
            total: pb.total.amount.value,
            currency: pb.total.currency.value,
            servicePrice: pb.servicePrice.amount.value,
            pricedAddOns: pb.pricedAddOns.map(po => ({
                addOnId: po.addOnId.value,
                unitPrice: po.unitPrice.amount.value,
                quantity: po.quantity,
                price: po.price.amount.value
            })),
            pricedOptions: pb.pricedOptions.map(po => ({
                serviceOptionId: po.serviceOptionId.value,
                unitPrice: po.unitPrice.amount.value,
                quantity: po.quantity,
                price: po.price.amount.value
            }))
        };
    }
}