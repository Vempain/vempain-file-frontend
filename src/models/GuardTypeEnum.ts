export const GuardTypeEnum = {
    SQUARE: "SQUARE",
    CIRCLE: "CIRCLE",
} as const;

export type GuardTypeEnum = typeof GuardTypeEnum[keyof typeof GuardTypeEnum];
