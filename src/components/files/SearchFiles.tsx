import {Button, Input, Modal, Select, Space, Spin, Table} from "antd";
import type {ColumnsType} from "antd/es/table";
import {useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import type {PagedRequest} from "@vempain/vempain-auth-frontend";
import type {FileResponse} from "../../models";
import {
    archiveFileAPI,
    audioFileAPI,
    binaryFileAPI,
    dataFileAPI,
    documentFileAPI,
    executableFileAPI,
    fontFileAPI,
    iconFileAPI,
    imageFileAPI,
    interactiveFileAPI,
    musicFileAPI,
    thumbFileAPI,
    vectorFileAPI,
    videoFileAPI
} from "../../services";
import {FileDetails} from "./FileDetails";
import {createdColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";

interface PageableFileAPI {
    findAllPageable(request: PagedRequest): Promise<{ content: FileResponse[] }>;
}

const fileAPIs: Record<string, PageableFileAPI> = {
    archive: archiveFileAPI, audio: audioFileAPI, binary: binaryFileAPI, data: dataFileAPI,
    document: documentFileAPI, executable: executableFileAPI, font: fontFileAPI, icon: iconFileAPI,
    image: imageFileAPI, interactive: interactiveFileAPI, music: musicFileAPI, thumb: thumbFileAPI,
    vector: vectorFileAPI, video: videoFileAPI
};

export function SearchFiles() {
    const {t} = useTranslation();
    const [query, setQuery] = useState("");
    const [fileType, setFileType] = useState("all");
    const [files, setFiles] = useState<FileResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<FileResponse | null>(null);

    const search = () => {
        const request: PagedRequest = {page: 0, size: 100, sort_by: "filename", direction: "ASC", case_sensitive: false, search: query.trim() || undefined};
        setLoading(true);
        const apis = fileType === "all" ? Object.values(fileAPIs) : [fileAPIs[fileType]];
        Promise.all(apis.map(api => api.findAllPageable(request)))
                .then(responses => setFiles(responses.flatMap(response => response.content ?? [])))
                .catch(() => setFiles([]))
                .finally(() => setLoading(false));
    };

    const columns: ColumnsType<FileResponse> = useMemo(() => [
        {
            title: t("SearchFiles.columns.filename", {defaultValue: "Filename"}), dataIndex: "filename", key: "filename",
            sorter: (a, b) => a.filename.localeCompare(b.filename),
            render: (value: string, record) => <Button type="link" onClick={() => setSelected(record)}>{value}</Button>
        },
        filePathColumn(t), fileSizeColumn(t), mimetypeColumn(t),
        {title: t("SearchFiles.columns.type", {defaultValue: "Type"}), dataIndex: "file_type", key: "file_type"},
        createdColumn(t)
    ], [t]);

    return <Space direction="vertical" style={{width: "95%", margin: 30}} size="large">
        <h1>{t("SearchFiles.title", {defaultValue: "Search files"})}</h1>
        <Space.Compact style={{width: "100%"}}>
            <Select value={fileType} onChange={setFileType} style={{minWidth: 150}}
                    options={[{value: "all", label: t("SearchFiles.allTypes", {defaultValue: "All types"})},
                        ...Object.keys(fileAPIs).map(type => ({value: type, label: t(`FileTypeEnum.${type}`, {defaultValue: type})}))]}/>
            <Input value={query} onChange={event => setQuery(event.target.value)} onPressEnter={search}
                   placeholder={t("SearchFiles.placeholder", {defaultValue: "Search filename, path or metadata"})}/>
            <Button type="primary" onClick={search}>{t("Common.search", {defaultValue: "Search"})}</Button>
        </Space.Compact>
        <Spin spinning={loading}>
            <Table rowKey={record => record.external_file_id || record.id} columns={columns} dataSource={files}
                   scroll={{x: "max-content"}} pagination={{showSizeChanger: true}}/>
        </Spin>
        <Modal open={selected !== null} footer={null} onCancel={() => setSelected(null)}
               title={selected?.filename ?? t("Common.modal.fileDetailsTitle", {defaultValue: "File details"})} destroyOnHidden>
            {selected && <FileDetails file={selected}/>}
        </Modal>
    </Space>;
}
