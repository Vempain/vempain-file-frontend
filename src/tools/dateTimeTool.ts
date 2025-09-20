import dayjs, {type Dayjs} from "dayjs";

/**
 * Comparator for Dayjs | null | undefined values.
 * - null/undefined are treated as smaller than any valid date
 * - invalid Dayjs is treated as smaller than valid ones
 */
export function compareDayjsNullable(a?: Dayjs | null, b?: Dayjs | null): number {
    if (!a && !b) return 0;
    if (!a) return -1;
    if (!b) return 1;

    const av = a.valueOf();
    const bv = b.valueOf();

    const aInvalid = Number.isNaN(av);
    const bInvalid = Number.isNaN(bv);
    if (aInvalid && bInvalid) return 0;
    if (aInvalid) return -1;
    if (bInvalid) return 1;

    return av - bv;
}

// Formats Dayjs | null to "YYYY-MM-DD HH:mm:ss"; returns "" for null/invalid.
export function formatDayjsNullable(d?: Dayjs | null): string {
    if (!d) return "";
    const v = d.valueOf();
    if (Number.isNaN(v)) return "";
    return d.format("YYYY-MM-DD HH:mm:ss");
}

export function formatDateWithTimeZone(val: Dayjs | Date | string | null): string {
    if (!val) {
        return "";
    }

    try {
        // Convert the input value to a dayjs object (assuming UTC)
        const d = dayjs.utc(val);
        if (!d.isValid()) return String(val);

        // Format date in local timezone with timezone name
        const formatted = d.local().format('YYYY-MM-DD HH:mm:ss');
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        return `${formatted} (${timezone})`;
    } catch {
        return String(val);
    }
}
