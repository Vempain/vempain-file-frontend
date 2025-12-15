import {Tag} from "antd";
import type {TFunction} from "i18next";
import type {FileTypeEnum as FileTypeEnumType} from "../models/FileTypeEnum";
import type {PathCompletionEnum as PathCompletionEnumType} from "../models/PathCompletionEnum";
import type {JSX} from "react";

export function fileTypeEnum2Tag(value: FileTypeEnumType, t: TFunction, recordId: number): JSX.Element {
    let color: string;
    const label = t("FileTypeEnum." + value.toLowerCase());

    switch (value) {
        case "IMAGE":
            color = "blue";
            break;
        case "VIDEO":
            color = "purple";
            break;
        case "AUDIO":
            color = "cyan";
            break;
        case "DOCUMENT":
            color = "geekblue";
            break;
        case "VECTOR":
            color = "volcano";
            break;
        case "ICON":
            color = "magenta";
            break;
        case "FONT":
            color = "gold";
            break;
        case "ARCHIVE":
            color = "orange";
            break;
        case "UNKNOWN":
            color = "default";
            break;
        default:
            color = "default";
            break;
    }

    return <Tag color={color} key={`file-type-${value}-${recordId}`}>{label}</Tag>;
}

export function pathCompletionEnum2Tag(value: PathCompletionEnumType, t: TFunction, recordId: number): JSX.Element {
    let color: string;
    const label = t("PathCompletionEnum." + value.toLowerCase());

    switch (value) {
        case "ORIGINAL":
            color = "blue";
            break;
        case "EXPORTED":
            color = "green";
            break;
        default:
            color = "default";
            break;
    }

    return <Tag color={color} key={`path-completion-${value}-${recordId}`}>{label}</Tag>;
}
