import {Space, Table, Tag} from "antd";
import type {ColumnsType} from "antd/es/table";
import type {FileResponse} from "../../models/responses";
import dayjs, {type Dayjs} from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {fileTypeEnum2Tag, formatDateWithTimeZone} from "../../tools";
import {FileTypeEnum} from "../../models";

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
    if (!file) {
        return null;
    }

    const columns: ColumnsType<DetailRow> = [
        {title: "Field", dataIndex: "label", key: "label", width: 240},
        {
            title: "Value",
            dataIndex: "value",
            key: "value",
        },
    ];

    console.log("Rendering FileDetails with file:", file);

    const rows: DetailRow[] = [
        {key: "id", label: "ID", value: file.id},
        {key: "filename", label: "Filename", value: file.filename},
        {key: "file_path", label: "File path", value: file.file_path},
        {key: "external_file_id", label: "External File ID", value: file.external_file_id},
        {key: "mimetype", label: "MIME Type", value: file.mimetype},
        {key: "filesize", label: "File Size", value: formatBytesToKB(file.filesize)},
        {key: "sha256sum", label: "SHA256 Sum", value: file.sha256sum},
        {
            key: "original_datetime",
            label: "Original Date",
            value: formatDateWithTimeZone(file.original_datetime == null ? null : file.original_datetime as Dayjs)
        },
        {key: "original_second_fraction", label: "Original Second Fraction", value: file.original_second_fraction ?? ""},
        {key: "original_document_id", label: "Original Document ID", value: file.original_document_id},
        {key: "description", label: "Description", value: file.description},
        {key: "file_type", label: "File Type", value: fileTypeEnum2Tag(file.file_type ?? FileTypeEnum.OTHER, null, 1)},
        {key: "rights_holder", label: "Rights Holder", value: file.rights_holder},
        {key: "rights_terms", label: "Rights Terms", value: file.rights_terms},
        {key: "rights_url", label: "Rights URL", value: file.rights_url},
        {key: "gps_timestamp", label: "GPS Timestamp", value: formatDateWithTimeZone(file.gps_timestamp == null ? null : file.gps_timestamp as Dayjs)},
        {key: "gps_location_id", label: "GPS Location ID", value: file.gps_location_id},
        {key: "creator_name", label: "Creator Name", value: file.creator_name},
        {key: "creator_country", label: "Creator Country", value: file.creator_country},
        {key: "creator_email", label: "Creator Email", value: file.creator_email},
        {key: "creator_url", label: "Creator URL", value: file.creator_url},
        {
            key: "tags",
            label: "Tags",
            value: (file.tags ?? []).length
                    ? (file.tags ?? []).map(tag => <Tag key={tag}>{tag}</Tag>)
                    : "",
        },
        // AbstractResponse fields
        {key: "locked", label: "Locked", value: file.locked ? "Yes" : "No"},
        {key: "creator", label: "Creator (ID)", value: file.creator ?? ""},
        {key: "created", label: "Created", value: formatDateWithTimeZone(file.created == null ? null : file.created as string)},
        {key: "modifier", label: "Modifier (ID)", value: file.modifier ?? ""},
        {key: "modified", label: "Modified", value: formatDateWithTimeZone(file.modified == null ? null : file.modified as string)},
        {
            key: "acls",
            label: "ACLs",
            value: Array.isArray(file.acls) ? `${file.acls.length} entr${file.acls.length === 1 ? "y" : "ies"}` : "",
        },
    ];

    return (
            <Space direction="vertical" style={{width: "100%"}}>
                <Table
                        columns={columns}
                        dataSource={rows}
                        pagination={false}
                        showHeader={false}
                        size="small"
                        rowKey="key"
                />
            </Space>
    );
}
