import dayjs, {type Dayjs} from "dayjs";

function padTo2Digits(num: number): string {
    return num.toString().padStart(2, "0");
}

function padTo3Digits(num: number): string {
    return num.toString().padStart(3, "0");
}

function formatDateTime(date: Dayjs | string): string {
    const value = dayjs.isDayjs(date) ? date : dayjs(date);
    return value.format("YYYY-MM-DD HH:mm");
}

function formatDate(date: Dayjs | string): string {
    const value = dayjs.isDayjs(date) ? date : dayjs(date);
    return value.format("YYYY-MM-DD");
}

function formatDateTimeWithMs(date: Dayjs | string): string {
    const value = dayjs.isDayjs(date) ? date : dayjs(date);
    return value.format("YYYY-MM-DD HH:mm:ss") + ":" + padTo3Digits(value.millisecond());
}

export {padTo2Digits, padTo3Digits, formatDateTime, formatDateTimeWithMs, formatDate};
