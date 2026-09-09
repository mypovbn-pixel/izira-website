export type OrderTemplateInput={businessName:string;customerName:string;orderNumber:number|string;total?:number;collectionText?:string};
export type AppointmentTemplateInput={businessName:string;customerName:string;serviceName?:string;startsAt:string|Date;total?:number;deposit?:number|null};
export type TransportTemplateInput={businessName:string;customerName:string;serviceName?:string;startsAt:string|Date;pickup:string;destination:string;total?:number;occurrences?:number;kind?:"runner"|"transport"};

export function formatBND(value:number){return `BND ${Number(value).toFixed(2)}`}
export function formatWhen(value:string|Date){return new Date(value).toLocaleString([], {dateStyle:"medium",timeStyle:"short"})}

export const orderWhatsApp={
 received:(x:OrderTemplateInput)=>`Hi ${x.customerName}, your order #${x.orderNumber} with ${x.businessName} has been received.${x.total!=null?` Total: ${formatBND(x.total)}.`:""} We’ll update you once payment is checked.`,
 paymentReminder:(x:OrderTemplateInput)=>`Hi ${x.customerName}, a quick reminder for order #${x.orderNumber} with ${x.businessName}.${x.total!=null?` The amount due is ${formatBND(x.total)}.`:""} Send your payment receipt when ready.`,
 paymentApproved:(x:OrderTemplateInput)=>`Hi ${x.customerName}, payment for order #${x.orderNumber} with ${x.businessName} has been approved. Thank you!`,
 receiptRejected:(x:OrderTemplateInput)=>`Hi ${x.customerName}, we couldn’t verify the receipt for order #${x.orderNumber}. Please check the payment details and send a clearer or corrected receipt.`,
 confirmed:(x:OrderTemplateInput)=>`Hi ${x.customerName}, order #${x.orderNumber} with ${x.businessName} is confirmed.${x.collectionText?` ${x.collectionText}`:""}`,
 ready:(x:OrderTemplateInput)=>`Hi ${x.customerName} 👋 Your order #${x.orderNumber} from ${x.businessName} is ready.${x.collectionText?` ${x.collectionText}`:""}`,
 thankYou:(x:OrderTemplateInput)=>`Thank you for ordering from ${x.businessName}, ${x.customerName}! We hope to see you again soon.`,
};

export const appointmentWhatsApp={
 requested:(x:AppointmentTemplateInput)=>`Hi ${x.customerName}, your booking request with ${x.businessName} has been received.${x.serviceName?` Service: ${x.serviceName}.`:""} Date & time: ${formatWhen(x.startsAt)}.${x.deposit!=null?` Deposit: ${formatBND(x.deposit)}.`:""}`,
 confirmed:(x:AppointmentTemplateInput)=>`Hi ${x.customerName}, your appointment with ${x.businessName} is confirmed.${x.serviceName?` Service: ${x.serviceName}.`:""} Date & time: ${formatWhen(x.startsAt)}.`,
 paymentReminder:(x:AppointmentTemplateInput)=>`Hi ${x.customerName}, a quick payment reminder for your appointment with ${x.businessName} on ${formatWhen(x.startsAt)}.${x.deposit!=null?` Deposit due: ${formatBND(x.deposit)}.`:""}`,
 reminder:(x:AppointmentTemplateInput)=>`Hi ${x.customerName} 👋 Just a reminder about your appointment with ${x.businessName}${x.serviceName?` for ${x.serviceName}`:""} on ${formatWhen(x.startsAt)}.`,
 rescheduled:(x:AppointmentTemplateInput)=>`Hi ${x.customerName}, your appointment with ${x.businessName} has been rescheduled to ${formatWhen(x.startsAt)}.${x.serviceName?` Service: ${x.serviceName}.`:""}`,
 rescheduleRequest:(x:AppointmentTemplateInput)=>`Hi ${x.businessName}, I’d like to request a different time for my appointment${x.serviceName?` for ${x.serviceName}`:""}, currently on ${formatWhen(x.startsAt)}.`,
 cancelled:(x:AppointmentTemplateInput)=>`Hi ${x.customerName}, your appointment with ${x.businessName} on ${formatWhen(x.startsAt)} has been cancelled. Please contact us if you’d like to book another time.`,
 thankYou:(x:AppointmentTemplateInput)=>`Thank you for booking with ${x.businessName}, ${x.customerName}! We hope to see you again soon.`,
};

export const transportWhatsApp={
 requested:(x:TransportTemplateInput)=>`Hi ${x.customerName}, your ${x.kind==="runner"?"runner job":"transport request"} with ${x.businessName} has been received.${x.serviceName?` Service: ${x.serviceName}.`:""}\nPickup: ${x.pickup}\nDestination: ${x.destination}\nFirst trip: ${formatWhen(x.startsAt)}${x.occurrences&&x.occurrences>1?`\nRecurring trips: ${x.occurrences}`:""}${x.total!=null&&x.total>0?`\nFare: ${formatBND(x.total)}`:"\nFare: awaiting quote"}`,
 confirmed:(x:TransportTemplateInput)=>`Hi ${x.customerName}, your ${x.kind==="runner"?"runner job":"trip"} with ${x.businessName} is confirmed.\nPickup: ${x.pickup}\nDestination: ${x.destination}\nTime: ${formatWhen(x.startsAt)}${x.total!=null&&x.total>0?`\nFare: ${formatBND(x.total)}`:""}`,
 quote:(x:TransportTemplateInput)=>`Hi ${x.customerName}, your fare from ${x.pickup} to ${x.destination} with ${x.businessName} is ${formatBND(x.total||0)}. Reply here to confirm.`,
 reminder:(x:TransportTemplateInput)=>`Hi ${x.customerName} 👋 Reminder for your ${x.kind==="runner"?"runner job":"trip"} with ${x.businessName}. Pickup: ${x.pickup}. Destination: ${x.destination}. Time: ${formatWhen(x.startsAt)}.`,
 recurringConfirmed:(x:TransportTemplateInput)=>`Hi ${x.customerName}, your recurring transport with ${x.businessName} is confirmed.${x.occurrences?` ${x.occurrences} scheduled trips.`:""} First pickup: ${formatWhen(x.startsAt)}. Route: ${x.pickup} → ${x.destination}.`,
};

export function whatsAppHref(phone:string,message:string){
 const digits=phone.replace(/\D/g,"");
 return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
