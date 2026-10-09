import {Button, message, Modal, Popconfirm, Space, Spin} from "antd";
import {useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {usePagedTable, VempainTable} from "@vempain/vempain-auth-frontend";
import {fontFileAPI} from "../../services";
import type {FontFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {PublishFileButton} from "./PublishFileButton";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function FontFiles() {
    const {t} = useTranslation();
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<FontFileResponse | null>(null);

    const paged = usePagedTable<FontFileResponse>(
            request => fontFileAPI.findAllPageable(request),
            {defaultPageSize: 10}
    );

    function handleDelete(id: number) {
        fontFileAPI.delete(id)
                .then(() => {
                    message.success(t("FontFiles.messages.deleteSuccess", {defaultValue: "Font file deleted successfully"}));
                    paged.reload();
                })
                .catch(err => {
                    console.error("Failed to delete font file:", err);
                    message.error(t("FontFiles.messages.deleteError", {defaultValue: "Failed to delete font file"}));
                })
    }

    const columns: ColumnsType<FontFileResponse> = [
        filenameColumn<FontFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }, t),
        filePathColumn<FontFileResponse>(t),
        fileSizeColumn<FontFileResponse>(t),
        mimetypeColumn<FontFileResponse>(t),
        {
            title: t("FontFiles.columns.font_family.title", {defaultValue: "Family"}),
            dataIndex: "font_family",
            key: "font_family",
        },
        {
            title: t("FontFiles.columns.weight.title", {defaultValue: "Weight"}),
            dataIndex: "weight",
            key: "weight",
        },
        {
            title: t("FontFiles.columns.style.title", {defaultValue: "Style"}),
            dataIndex: "style",
            key: "style",
        },
        createdColumn<FontFileResponse>(t),
        {
            title: t("FontFiles.columns.actions.title", {defaultValue: "Actions"}),
            key: "actions",
            render: (_: undefined, record: FontFileResponse) => (
                    <Space>
                        <PublishFileButton file={record} onPublished={() => paged.reload()}/>
                        <Popconfirm
                                title={t("FontFiles.popconfirm.delete.title", {defaultValue: "Delete this font file"})}
                                description={t("FontFiles.popconfirm.delete.description", {defaultValue: "Are you sure you want to delete this font file?"})}
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
                    }{paged.dataSource.length === 0 && !paged.loading && t("FontFiles.messages.noFiles", {defaultValue: "No font files found"})}
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

