import {render, screen} from "@testing-library/react";
import type {TFunction} from "i18next";
import {FileTypeEnum, PathCompletionEnum} from "../../models";
import {fileTypeEnum2Tag, pathCompletionEnum2Tag} from "../../tools/enumToTagTool";

const t = ((key: string) => key) as TFunction;

describe("fileTypeEnum2Tag", () => {
    it.each([
        [FileTypeEnum.IMAGE, "blue"],
        [FileTypeEnum.VIDEO, "purple"],
        [FileTypeEnum.AUDIO, "cyan"],
        [FileTypeEnum.DOCUMENT, "geekblue"],
        [FileTypeEnum.VECTOR, "volcano"],
        [FileTypeEnum.ICON, "magenta"],
        [FileTypeEnum.FONT, "gold"],
        [FileTypeEnum.ARCHIVE, "orange"],
        [FileTypeEnum.UNKNOWN, "default"],
        [FileTypeEnum.MUSIC, "default"]
    ])("renders %s as a %s tag with the translated label", (value, color) => {
        const {container} = render(fileTypeEnum2Tag(value, t, 7));

        expect(screen.getByText(`FileTypeEnum.${value.toLowerCase()}`)).toBeTruthy();
        expect(container.querySelector(`.ant-tag-${color}`)).not.toBeNull();
    });

    it("keys the tag by file type and record id", () => {
        expect(fileTypeEnum2Tag(FileTypeEnum.IMAGE, t, 3).key).toBe("file-type-IMAGE-3");
    });
});

describe("pathCompletionEnum2Tag", () => {
    it.each([
        [PathCompletionEnum.ORIGINAL, "blue"],
        [PathCompletionEnum.EXPORTED, "green"],
        ["OTHER" as PathCompletionEnum, "default"]
    ])("renders %s as a %s tag", (value, color) => {
        const {container} = render(pathCompletionEnum2Tag(value, t, 2));

        expect(screen.getByText(`PathCompletionEnum.${value.toLowerCase()}`)).toBeTruthy();
        expect(container.querySelector(`.ant-tag-${color}`)).not.toBeNull();
        expect(pathCompletionEnum2Tag(value, t, 2).key).toBe(`path-completion-${value}-2`);
    });
});
