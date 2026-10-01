import {Button, message, Modal, Popconfirm, Space, Spin} from "antd";
import {useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {usePagedTable, VempainTable} from "@vempain/vempain-auth-frontend";
import {thumbFileAPI} from "../../services";
import type {ThumbFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function ThumbFiles() {
    const {t} = useTranslation();
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<ThumbFileResponse | null>(null);

    const paged = usePagedTable<ThumbFileResponse>(
            request => thumbFileAPI.findAllPageable(request),
            {defaultPageSize: 10}
    );

    function handleDelete(id: number) {
        thumbFileAPI.delete(id)
                .then(() => {
                    message.success(t("ThumbFiles.messages.deleteSuccess", {defaultValue: "Thumbnail file deleted successfully"}));
                    paged.reload();
                })
                .catch(err => {
                    console.error("Failed to delete thumbnail file:", err);
                    message.error(t("ThumbFiles.messages.deleteError", {defaultValue: "Failed to delete thumbnail file"}));
                })
    }

    const columns: ColumnsType<ThumbFileResponse> = [
        filenameColumn<ThumbFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }, t),
        filePathColumn<ThumbFileResponse>(t),
        fileSizeColumn<ThumbFileResponse>(t),
        mimetypeColumn<ThumbFileResponse>(t),
        {
            title: t("ThumbFiles.columns.relation_type.title", {defaultValue: "Relation type"}),
            dataIndex: "relation_type",
            key: "relation_type",
        },
        {
            title: t("ThumbFiles.columns.target_file_id.title", {defaultValue: "Target file ID"}),
            dataIndex: "target_file_id",
            key: "target_file_id",
        },
        createdColumn<ThumbFileResponse>(t),
        {
            title: t("ThumbFiles.columns.actions.title", {defaultValue: "Actions"}),
            key: "actions",
            render: (_: undefined, record: ThumbFileResponse) => (
                    <Popconfirm
                            title={t("ThumbFiles.popconfirm.delete.title", {defaultValue: "Delete this thumbnail file"})}
                            description={t("ThumbFiles.popconfirm.delete.description", {defaultValue: "Are you sure you want to delete this thumbnail file?"})}
                            onConfirm={() => handleDelete(record.id)}
                            okText={t("Common.popconfirm.yes", {defaultValue: "Yes"})}
                            cancelText={t("Common.popconfirm.no", {defaultValue: "No"})}
                    >
                        <Button danger icon={<DeleteOutlined/>}/>
                    </Popconfirm>
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
                    }{paged.dataSource.length === 0 && !paged.loading && t("ThumbFiles.messages.noFiles", {defaultValue: "No thumbnail files found"})}
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

