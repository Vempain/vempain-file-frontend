import {Button, message, Modal, Popconfirm, Space, Spin} from "antd";
import {useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {usePagedTable, VempainTable} from "@vempain/vempain-auth-frontend";
import {binaryFileAPI} from "../../services";
import type {BinaryFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function BinaryFiles() {
    const {t} = useTranslation();
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<BinaryFileResponse | null>(null);

    const paged = usePagedTable<BinaryFileResponse>(
            request => binaryFileAPI.findAllPageable(request),
            {defaultPageSize: 10}
    );

    function handleDelete(id: number) {
        binaryFileAPI.delete(id)
                .then(() => {
                    message.success(t("BinaryFiles.messages.deleteSuccess", {defaultValue: "Binary file deleted successfully"}));
                    paged.reload();
                })
                .catch(err => {
                    console.error("Failed to delete binary file:", err);
                    message.error(t("BinaryFiles.messages.deleteError", {defaultValue: "Failed to delete binary file"}));
                })
    }

    const columns: ColumnsType<BinaryFileResponse> = [
        filenameColumn<BinaryFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }, t),
        filePathColumn<BinaryFileResponse>(t),
        fileSizeColumn<BinaryFileResponse>(t),
        mimetypeColumn<BinaryFileResponse>(t),
        {
            title: t("BinaryFiles.columns.software_name.title", {defaultValue: "Software"}),
            dataIndex: "software_name",
            key: "software_name",
        },
        {
            title: t("BinaryFiles.columns.software_major_version.title", {defaultValue: "Major version"}),
            dataIndex: "software_major_version",
            key: "software_major_version",
        },
        createdColumn<BinaryFileResponse>(t),
        {
            title: t("BinaryFiles.columns.actions.title", {defaultValue: "Actions"}),
            key: "actions",
            render: (_: undefined, record: BinaryFileResponse) => (
                    <Popconfirm
                            title={t("BinaryFiles.popconfirm.delete.title", {defaultValue: "Delete this binary file"})}
                            description={t("BinaryFiles.popconfirm.delete.description", {defaultValue: "Are you sure you want to delete this binary file?"})}
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
                    }{paged.dataSource.length === 0 && !paged.loading && t("BinaryFiles.messages.noFiles", {defaultValue: "No binary files found"})}
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

