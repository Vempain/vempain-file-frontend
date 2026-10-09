import {Button, message, Modal, Popconfirm, Space, Spin} from "antd";
import {useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {usePagedTable, VempainTable} from "@vempain/vempain-auth-frontend";
import {dataFileAPI} from "../../services";
import type {DataFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {PublishFileButton} from "./PublishFileButton";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function DataFiles() {
    const {t} = useTranslation();
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<DataFileResponse | null>(null);

    const paged = usePagedTable<DataFileResponse>(
            request => dataFileAPI.findAllPageable(request),
            {defaultPageSize: 10}
    );

    function handleDelete(id: number) {
        dataFileAPI.delete(id)
                .then(() => {
                    message.success(t("DataFiles.messages.deleteSuccess", {defaultValue: "Data file deleted successfully"}));
                    paged.reload();
                })
                .catch(err => {
                    console.error("Failed to delete data file:", err);
                    message.error(t("DataFiles.messages.deleteError", {defaultValue: "Failed to delete data file"}));
                })
    }

    const columns: ColumnsType<DataFileResponse> = [
        filenameColumn<DataFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }, t),
        filePathColumn<DataFileResponse>(t),
        fileSizeColumn<DataFileResponse>(t),
        mimetypeColumn<DataFileResponse>(t),
        {
            title: t("DataFiles.columns.data_structure.title", {defaultValue: "Data structure"}),
            dataIndex: "data_structure",
            key: "data_structure",
        },
        createdColumn<DataFileResponse>(t),
        {
            title: t("DataFiles.columns.actions.title", {defaultValue: "Actions"}),
            key: "actions",
            render: (_: undefined, record: DataFileResponse) => (
                    <Space>
                        <PublishFileButton file={record} onPublished={() => paged.reload()}/>
                        <Popconfirm
                                title={t("DataFiles.popconfirm.delete.title", {defaultValue: "Delete this data file"})}
                                description={t("DataFiles.popconfirm.delete.description", {defaultValue: "Are you sure you want to delete this data file?"})}
                                onConfirm={() => handleDelete(record.id)}
                                okText={t("Common.popconfirm.yes", {defaultValue: "Yes"})}
                                cancelText={t("Common.popconfirm.no", {defaultValue: "No"})}
                        >
                            <Button danger icon={<DeleteOutlined/>}/>
                        </Popconfirm>
                    </Space>
            ),
        },
    ];

    return (
            <Space vertical={true} style={{width: "95%", margin: 30}} size="large">
                {paged.contextHolder}
                <Spin spinning={paged.loading}>
                    {paged.dataSource.length > 0 && <VempainTable
                            dataMode="server"
                            paged={paged}
                            columns={columns}
                            scroll={{x: "max-content"}}
                            rowKey="external_file_id"
                    />
                    }{paged.dataSource.length === 0 && !paged.loading && t("DataFiles.messages.noFiles", {defaultValue: "No data files found"})}
                </Spin>
                <Modal
                        open={detailsOpen}
                        onCancel={() => setDetailsOpen(false)}
                        afterClose={() => setSelectedFile(null)}
                        footer={null}
                        destroyOnHidden
                        maskClosable
                        title={selectedFile?.filename || t("Common.modal.fileDetailsTitle", {defaultValue: "File details"})}
                        width={720}
                >
                    {selectedFile != null && <FileDetails file={selectedFile}/>}
                </Modal>
            </Space>
    );
}

