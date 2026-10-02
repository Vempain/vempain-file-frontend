import {Button, message, Modal, Popconfirm, Space, Spin} from "antd";
import {useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {usePagedTable, VempainTable} from "@vempain/vempain-auth-frontend";
import {executableFileAPI} from "../../services";
import type {ExecutableFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function ExecutableFiles() {
    const {t} = useTranslation();
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<ExecutableFileResponse | null>(null);

    const paged = usePagedTable<ExecutableFileResponse>(
            request => executableFileAPI.findAllPageable(request),
            {defaultPageSize: 10}
    );

    function handleDelete(id: number) {
        executableFileAPI.delete(id)
                .then(() => {
                    message.success(t("ExecutableFiles.messages.deleteSuccess", {defaultValue: "Executable file deleted successfully"}));
                    paged.reload();
                })
                .catch(err => {
                    console.error("Failed to delete executable file:", err);
                    message.error(t("ExecutableFiles.messages.deleteError", {defaultValue: "Failed to delete executable file"}));
                })
    }

    const columns: ColumnsType<ExecutableFileResponse> = [
        filenameColumn<ExecutableFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }, t),
        filePathColumn<ExecutableFileResponse>(t),
        fileSizeColumn<ExecutableFileResponse>(t),
        mimetypeColumn<ExecutableFileResponse>(t),
        {
            title: t("ExecutableFiles.columns.operating_systems.title", {defaultValue: "Operating systems"}),
            dataIndex: "operating_systems",
            key: "operating_systems",
            render: (systems?: string[]) => Array.isArray(systems) ? systems.join(", ") : "",
        },
        {
            title: t("ExecutableFiles.columns.script.title", {defaultValue: "Script"}),
            dataIndex: "script",
            key: "script",
            render: (value: boolean) => value ? t("Common.general.yes", {defaultValue: "Yes"}) : t("Common.general.no", {defaultValue: "No"}),
        },
        createdColumn<ExecutableFileResponse>(t),
        {
            title: t("ExecutableFiles.columns.actions.title", {defaultValue: "Actions"}),
            key: "actions",
            render: (_: undefined, record: ExecutableFileResponse) => (
                    <Popconfirm
                            title={t("ExecutableFiles.popconfirm.delete.title", {defaultValue: "Delete this executable file"})}
                            description={t("ExecutableFiles.popconfirm.delete.description", {defaultValue: "Are you sure you want to delete this executable file?"})}
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
                    }{paged.dataSource.length === 0 && !paged.loading && t("ExecutableFiles.messages.noFiles", {defaultValue: "No executable files found"})}
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

