import { AddOn, addOnWithTotal, Order, orderLineWithTotal, orderWithTotal, OrderWithTotal, Service } from './types.js';
import { mandatory } from './utils.js';

export function calculateOrderTotal(order: Order, services: Service[], addOns: AddOn[]): OrderWithTotal {
	return orderWithTotal(order, order.lines.map(line => {
		const service = mandatory(services.find(s => s.id.value === line.serviceId.value), `Service with id ${line.serviceId.value} not found`);
		return orderLineWithTotal(service, line.addOns.map(addOnOrder => {
			const addOn = mandatory(addOns.find(a => a.id.value === addOnOrder.addOnId.value), `Add on with id ${addOnOrder.addOnId.value} not found`);
			return addOnWithTotal(addOn, addOnOrder.quantity);
		}));
	}));
}