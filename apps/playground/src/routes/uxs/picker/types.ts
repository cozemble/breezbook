export type IsoDateString = string;
export type TimeString = string;
export type PriceString = string;

export interface DateLabels {
    [key: IsoDateString]: PriceString;
}

export interface TimeLabels {
    [key: IsoDateString]: {
        [key: TimeString]: PriceString;
    };
}

export interface DisabledDays {
    [key: IsoDateString]: boolean;
}

export function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function convertTo12Hour(time24: TimeString): string {
    const [hour, minute] = time24.split(':');
    let hour12 = parseInt(hour, 10) % 12;
    hour12 = hour12 === 0 ? 12 : hour12;
    const amPm = parseInt(hour, 10) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minute} ${amPm}`;
}
