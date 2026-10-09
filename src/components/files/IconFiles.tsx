import {Button, message, Modal, Popconfirm, Space, Spin} from "antd";
import {useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {usePagedTable, VempainTable} from "@vempain/vempain-auth-frontend";
import {iconFileAPI} from "../../services";
import type {IconFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {PublishFileButton} from "./PublishFileButton";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function IconFiles() {
    const {t} = useTranslation();
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<IconFileResponse | null>(null);

    const paged = usePagedTable<IconFileResponse>(
            request => iconFileAPI.findAllPageable(request),
            {defaultPageSize: 10}
    );

    function handleDelete(id: number) {
        iconFileAPI.delete(id)
                .then(() => {
                    message.success(t("IconFiles.messages.deleteSuccess", {defaultValue: "Icon file deleted successfully"}));
                    paged.reload();
                })
                .catch(err => {
                    console.error("Failed to delete icon file:", err);
                    message.error(t("IconFiles.messages.deleteError", {defaultValue: "Failed to delete icon file"}));
                })
    }

    const columns: ColumnsType<IconFileResponse> = [
        filenameColumn<IconFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }, t),
        filePathColumn<IconFileResponse>(t),
        fileSizeColumn<IconFileResponse>(t),
        mimetypeColumn<IconFileResponse>(t),
        {
            title: t("IconFiles.columns.width.title", {defaultValue: "Width"}),
            dataIndex: "width",
            key: "width",
        },
        {
            title: t("IconFiles.columns.height.title", {defaultValue: "Height"}),
            dataIndex: "height",
            key: "height",
        },
        {
            title: t("IconFiles.columns.is_scalable.title", {defaultValue: "Scalable"}),
            dataIndex: "is_scalable",
            key: "is_scalable",
            render: (value: boolean) => value ? t("Common.general.yes", {defaultValue: "Yes"}) : t("Common.general.no", {defaultValue: "No"}),
        },
        createdColumn<IconFileResponse>(t),
        {
            title: t("IconFiles.columns.actions.title", {defaultValue: "Actions"}),
            key: "actions",
            render: (_: undefined, record: IconFileResponse) => (
                    <Space>
                        <PublishFileButton file={record} onPublished={() => paged.reload()}/>
                        <Popconfirm
                                title={t("IconFiles.popconfirm.delete.title", {defaultValue: "Delete this icon file"})}
                                description={t("IconFiles.popconfirm.delete.description", {defaultValue: "Are you sure you want to delete this icon file?"})}
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
                    }{paged.dataSource.length === 0 && !paged.loading && t("IconFiles.messages.noFiles", {defaultValue: "No icon files found"})}
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

