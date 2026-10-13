import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {compareDayjsNullable, formatDateWithTimeZone, formatDayjsNullable} from "../../tools/dateTimeTool";

describe("compareDayjsNullable", () => {
    const earlier = dayjs("2024-01-01T00:00:00Z");
    const later = dayjs("2024-06-01T00:00:00Z");
    const invalid = dayjs("not a date");

    it("treats missing values as smaller than any date and equal to each other", () => {
        expect(compareDayjsNullable(null, undefined)).toBe(0);
        expect(compareDayjsNullable(null, earlier)).toBe(-1);
        expect(compareDayjsNullable(earlier, undefined)).toBe(1);
    });

    it("treats invalid dates as smaller than valid ones and equal to each other", () => {
        expect(compareDayjsNullable(invalid, dayjs("still not a date"))).toBe(0);
        expect(compareDayjsNullable(invalid, earlier)).toBe(-1);
        expect(compareDayjsNullable(earlier, invalid)).toBe(1);
    });

    it("orders valid dates chronologically", () => {
        expect(compareDayjsNullable(earlier, later)).toBeLessThan(0);
        expect(compareDayjsNullable(later, earlier)).toBeGreaterThan(0);
        expect(compareDayjsNullable(earlier, dayjs(earlier))).toBe(0);
    });
});

describe("formatDayjsNullable", () => {
    it("returns an empty string for missing or invalid dates", () => {
        expect(formatDayjsNullable(null)).toBe("");
        expect(formatDayjsNullable(undefined)).toBe("");
        expect(formatDayjsNullable(dayjs("nonsense"))).toBe("");
    });

    it("formats a valid date as YYYY-MM-DD HH:mm:ss", () => {
        expect(formatDayjsNullable(dayjs("2024-03-05T07:08:09"))).toBe("2024-03-05 07:08:09");
    });
});

describe("formatDateWithTimeZone", () => {
    it("returns an empty string for null", () => {
        expect(formatDateWithTimeZone(null)).toBe("");
    });

    it("falls back to the raw value when the utc plugin is not loaded", () => {
        // dayjs.utc is only available once a module extends dayjs with the utc plugin (FileDetails does), so this call
        // throws inside the helper and the input is returned as a string
        expect(formatDateWithTimeZone("2024-03-05T07:08:09Z")).toBe("2024-03-05T07:08:09Z");
    });

    describe("with the utc plugin", () => {
        beforeAll(() => dayjs.extend(utc));

        it("formats the value in the local time zone and appends the zone name", () => {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const expected = dayjs.utc("2024-03-05T07:08:09Z").local().format("YYYY-MM-DD HH:mm:ss");
            expect(formatDateWithTimeZone("2024-03-05T07:08:09Z")).toBe(`${expected} (${timezone})`);
            expect(formatDateWithTimeZone(new Date("2024-03-05T07:08:09Z"))).toBe(`${expected} (${timezone})`);
            expect(formatDateWithTimeZone(dayjs("2024-03-05T07:08:09Z"))).toBe(`${expected} (${timezone})`);
        });

        it("returns the raw value for an invalid date", () => {
            expect(formatDateWithTimeZone("not a date")).toBe("not a date");
        });
    });
});
