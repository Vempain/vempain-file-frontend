import {Button, message, Modal, Popconfirm, Space, Spin} from "antd";
import {useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {usePagedTable, VempainTable} from "@vempain/vempain-auth-frontend";
import {interactiveFileAPI} from "../../services";
import type {InteractiveFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {PublishFileButton} from "./PublishFileButton";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function InteractiveFiles() {
    const {t} = useTranslation();
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<InteractiveFileResponse | null>(null);

    const paged = usePagedTable<InteractiveFileResponse>(
            request => interactiveFileAPI.findAllPageable(request),
            {defaultPageSize: 10}
    );

    function handleDelete(id: number) {
        interactiveFileAPI.delete(id)
                .then(() => {
                    message.success(t("InteractiveFiles.messages.deleteSuccess", {defaultValue: "Interactive file deleted successfully"}));
                    paged.reload();
                })
                .catch(err => {
                    console.error("Failed to delete interactive file:", err);
                    message.error(t("InteractiveFiles.messages.deleteError", {defaultValue: "Failed to delete interactive file"}));
                })
    }

    const columns: ColumnsType<InteractiveFileResponse> = [
        filenameColumn<InteractiveFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }, t),
        filePathColumn<InteractiveFileResponse>(t),
        fileSizeColumn<InteractiveFileResponse>(t),
        mimetypeColumn<InteractiveFileResponse>(t),
        {
            title: t("InteractiveFiles.columns.technology.title", {defaultValue: "Technology"}),
            dataIndex: "technology",
            key: "technology",
        },
        createdColumn<InteractiveFileResponse>(t),
        {
            title: t("InteractiveFiles.columns.actions.title", {defaultValue: "Actions"}),
            key: "actions",
            render: (_: undefined, record: InteractiveFileResponse) => (
                    <Space>
                        <PublishFileButton file={record} onPublished={() => paged.reload()}/>
                        <Popconfirm
                                title={t("InteractiveFiles.popconfirm.delete.title", {defaultValue: "Delete this interactive file"})}
                                description={t("InteractiveFiles.popconfirm.delete.description", {defaultValue: "Are you sure you want to delete this interactive file?"})}
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
                    }{paged.dataSource.length === 0 && !paged.loading && t("InteractiveFiles.messages.noFiles", {defaultValue: "No interactive files found"})}
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

