export const FileTypeEnum = {
    ARCHIVE: 'ARCHIVE',
    AUDIO: 'AUDIO',
    BINARY: 'BINARY',
    MUSIC: 'MUSIC',
    DATA: 'DATA',
    DOCUMENT: 'DOCUMENT',
    EXECUTABLE: 'EXECUTABLE',
    FONT: 'FONT',
    ICON: 'ICON',
    IMAGE: 'IMAGE',
    INTERACTIVE: 'INTERACTIVE',
    UNKNOWN: 'UNKNOWN',
    VECTOR: 'VECTOR',
    VIDEO: 'VIDEO',
} as const;

export type FileTypeEnum = typeof FileTypeEnum[keyof typeof FileTypeEnum];
