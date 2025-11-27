import {Space, Table, Tag} from "antd";
import type {ColumnsType} from "antd/es/table";
import type {FileResponse} from "../../models";
import {FileTypeEnum} from "../../models";
import dayjs, {type Dayjs} from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {fileTypeEnum2Tag, formatDateWithTimeZone} from "../../tools";
import {useTranslation} from "react-i18next";
import {DisplayMap} from "../common";

dayjs.extend(utc);

type DetailRow = {
    key: string;
    label: string;
    value: React.ReactNode;
};

type Props = {
    file: Partial<FileResponse>;
};

function formatBytesToKB(val?: number): string {
    if (val == null) return "";
    return `${(val / 1024).toFixed(2)} KB`;
}

export function FileDetails({file}: Props) {
    const {t} = useTranslation();

    if (!file) {
        return null;
    }

    const columns: ColumnsType<DetailRow> = [
        {title: t("FileDetails.table.field"), dataIndex: "label", key: "label", width: 240},
        {title: t("FileDetails.table.value"), dataIndex: "value", key: "value"},
    ];

    console.log("Rendering FileDetails with file:", file);

    const rows: DetailRow[] = [
        {key: "id", label: t("FileDetails.rows.id.label"), value: file.id},
        {key: "filename", label: t("FileDetails.rows.filename.label"), value: file.filename},
        {key: "file_path", label: t("FileDetails.rows.file_path.label"), value: file.file_path},
        {key: "external_file_id", label: t("FileDetails.rows.external_file_id.label"), value: file.external_file_id},
        {key: "mimetype", label: t("FileDetails.rows.mimetype.label"), value: file.mimetype},
        {key: "filesize", label: t("FileDetails.rows.filesize.label"), value: formatBytesToKB(file.filesize)},
        {key: "sha256sum", label: t("FileDetails.rows.sha256sum.label"), value: file.sha256sum},
        {
            key: "original_datetime",
            label: t("FileDetails.rows.original_datetime.label"),
            value: formatDateWithTimeZone(file.original_datetime == null ? null : (file.original_datetime as Dayjs))
        },
        {key: "original_second_fraction", label: t("FileDetails.rows.original_second_fraction.label"), value: file.original_second_fraction ?? ""},
        {key: "original_document_id", label: t("FileDetails.rows.original_document_id.label"), value: file.original_document_id},
        {key: "description", label: t("FileDetails.rows.description.label"), value: file.description},
        {key: "file_type", label: t("FileDetails.rows.file_type.label"), value: fileTypeEnum2Tag(file.file_type ?? FileTypeEnum.OTHER, t, 1)},
        {key: "rights_holder", label: t("FileDetails.rows.rights_holder.label"), value: file.rights_holder},
        {key: "rights_terms", label: t("FileDetails.rows.rights_terms.label"), value: file.rights_terms},
        {key: "rights_url", label: t("FileDetails.rows.rights_url.label"), value: file.rights_url},
        {
            key: "gps_timestamp",
            label: t("FileDetails.rows.gps_timestamp.label"),
            value: formatDateWithTimeZone(file.gps_timestamp == null ? null : (file.gps_timestamp as Dayjs))
        },
        {
            key: "gps_location_id",
            label: t("FileDetails.rows.gps_location_id.label"),
            value: file.location ? <DisplayMap location={file.location}/> : ""
        },
        {key: "creator_name", label: t("FileDetails.rows.creator_name.label"), value: file.creator_name},
        {key: "creator_country", label: t("FileDetails.rows.creator_country.label"), value: file.creator_country},
        {key: "creator_email", label: t("FileDetails.rows.creator_email.label"), value: file.creator_email},
        {key: "creator_url", label: t("FileDetails.rows.creator_url.label"), value: file.creator_url},
        {
            key: "tags",
            label: t("FileDetails.rows.tags.label"),
            value: (file.tags ?? []).length
                    ? (file.tags ?? []).map(tag => <Tag key={tag}>{tag}</Tag>)
                    : "",
        },
        {key: "locked", label: t("FileDetails.rows.locked.label"), value: file.locked ? t("Common.general.yes") : t("Common.general.no")},
        {key: "creator", label: t("FileDetails.rows.creator.label"), value: file.creator ?? ""},
        {key: "created", label: t("FileDetails.rows.created.label"), value: formatDateWithTimeZone(file.created == null ? null : file.created)},
        {key: "modifier", label: t("FileDetails.rows.modifier.label"), value: file.modifier ?? ""},
        {key: "modified", label: t("FileDetails.rows.modified.label"), value: formatDateWithTimeZone(file.modified == null ? null : file.modified)},
        {
            key: "acls",
            label: t("FileDetails.rows.acls.label"),
            value: Array.isArray(file.acls) ? file.acls.length : "",
        },
    ];

    return (

            <Space vertical={true} style={{width: "100%"}}>
                <Table
                        columns={columns}
                        dataSource={rows}
                        pagination={false}
                        showHeader={false}
                        size="small"
                        rowKey="key"
                />
            </Space>);
}
