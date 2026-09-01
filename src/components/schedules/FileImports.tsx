import {message, Space, Spin, Table} from "antd";
import type {ColumnsType} from "antd/es/table";
import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {adminScheduleAPI, type FileImportScheduleResponse} from "../../services";

export function FileImports() {
    const {t} = useTranslation();
    const [schedules, setSchedules] = useState<FileImportScheduleResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminScheduleAPI.getFileImportSchedules()
                .then(setSchedules)
                .catch(error => message.error(t("FileImports.messages.fetchError", {
                    defaultValue: "Failed to load file import schedules",
                    error: String(error)
                })))
                .finally(() => setLoading(false));
    }, [t]);

    const columns: ColumnsType<FileImportScheduleResponse> = [
        {title: t("FileImports.columns.id", {defaultValue: "ID"}), dataIndex: "id", key: "id"},
        {title: t("FileImports.columns.source", {defaultValue: "Source directory"}), dataIndex: "source_directory", key: "source_directory"},
        {
            title: t("FileImports.columns.destination", {defaultValue: "Destination directory"}),
            dataIndex: "destination_directory",
            key: "destination_directory"
        },
        {
            title: t("FileImports.columns.gallery", {defaultValue: "Gallery"}),
            dataIndex: "generate_gallery",
            key: "generate_gallery",
            render: value => value ? "✓" : "—"
        },
        {title: t("FileImports.columns.page", {defaultValue: "Page"}), dataIndex: "generate_page", key: "generate_page", render: value => value ? "✓" : "—"}
    ];

    return <Space direction="vertical" style={{width: "95%", margin: 30}} size="large">
        <h1>{t("FileImports.title", {defaultValue: "File import schedules"})}</h1>
        <Spin spinning={loading}><Table rowKey="id" columns={columns} dataSource={schedules} scroll={{x: "max-content"}}/></Spin>
    </Space>;
}
