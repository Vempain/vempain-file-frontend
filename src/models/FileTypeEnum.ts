export const FileTypeEnum = {
    IMAGE: 'IMAGE',
    VIDEO: 'VIDEO',
    AUDIO: 'AUDIO',
    DOCUMENT: 'DOCUMENT',
    VECTOR: 'VECTOR',
    ICON: 'ICON',
    FONT: 'FONT',
    ARCHIVE: 'ARCHIVE',
    OTHER: 'OTHER',
} as const;

export type FileTypeEnum = typeof FileTypeEnum[keyof typeof FileTypeEnum];
