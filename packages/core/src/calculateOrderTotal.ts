import {
    AddOn,
    addOnWithTotal,
    Coupon,
    currency,
    Order,
    orderLineWithTotal,
    orderWithTotal,
    OrderWithTotal,
    price,
    priceFns,
} from './types.js';
import {mandatory} from './utils.js';

function applyCoupon(coupon: Coupon, result: OrderWithTotal) {
    if (coupon.value._type === 'amount.coupon') {
        return {
            ...result,
            couponDiscount: coupon.value.amount,
            orderTotal: priceFns.subtract(result.orderTotal, coupon.value.amount)
        };
    } else {
        const couponDiscount = priceFns.multiply(result.orderTotal, coupon.value.percentage.value);
        return {
            ...result,
            couponDiscount,
            orderTotal: priceFns.subtract(result.orderTotal, couponDiscount)
        };
    }
}

export function calculateOrderTotal(order: Order, addOns: AddOn[], coupons: Coupon[]): OrderWithTotal {
    let result = orderWithTotal(
        order,
        order.lines.map((line) => {
            return orderLineWithTotal(
                line.serviceId,
                price(line.servicePrice, currency(line.servicePriceCurrency)),
                line.addOns.map((addOnOrder) => {
                    const addOn = mandatory(
                        addOns.find((a) => a.id.value === addOnOrder.addOnId.value),
                        `Add on with id ${addOnOrder.addOnId.value} not found`
                    );
                    return addOnWithTotal(addOn, addOnOrder.quantity);
                })
            );
        })
    );
    const couponCode = order.couponCode;
    if (couponCode) {
        const coupon = mandatory(
            coupons.find((c) => c.code.value === couponCode.value),
            `Coupon with code ${couponCode.value} not found`
        );
        result = applyCoupon(coupon, result);
    }
    return result;
}
