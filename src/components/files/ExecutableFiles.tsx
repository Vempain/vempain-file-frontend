import {Button, message, Modal, Popconfirm, Space, Spin, Table} from "antd";
import {useCallback, useEffect, useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import type {PagedRequest} from "@vempain/vempain-auth-frontend";
import {executableFileAPI} from "../../services";
import type {ExecutableFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function ExecutableFiles() {
    const {t} = useTranslation();
    const [loading, setLoading] = useState(true);
    const [executableFiles, setExecutableFiles] = useState<ExecutableFileResponse[]>([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<ExecutableFileResponse | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalElements, setTotalElements] = useState<number>(0);

    const fetchExecutableFiles = useCallback((page: number, size: number) => {
        setLoading(true);
        const pagedRequest: PagedRequest = {
            page: page - 1,
            size,
        };

        executableFileAPI.findAllPageable(pagedRequest)
                .then(response => {
                    if (response?.content) {
                        setExecutableFiles(response.content);
                    }

                    setTotalElements(response.total_elements ?? 0);
                    setCurrentPage(response.page + 1);
                    setPageSize(response.size);
                })
                .catch(err => {
                    console.error("Failed to fetch executable files:", err);
                    message.error(t("ExecutableFiles.messages.fetchError", {defaultValue: "Failed to load executable files"}));
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [t]);

    useEffect(() => {
        fetchExecutableFiles(1, pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleDelete(id: number) {
        setLoading(true);
        executableFileAPI.delete(id)
                .then(() => {
                    message.success(t("ExecutableFiles.messages.deleteSuccess", {defaultValue: "Executable file deleted successfully"}));
                    fetchExecutableFiles(currentPage, pageSize);
                })
                .catch(err => {
                    console.error("Failed to delete executable file:", err);
                    message.error(t("ExecutableFiles.messages.deleteError", {defaultValue: "Failed to delete executable file"}));
                })
                .finally(() => {
                    setLoading(false);
                });
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

    function handleTableChange(pagination: { current?: number; pageSize?: number }) {
        const nextPage = pagination.current ?? 1;
        const nextSize = pagination.pageSize ?? pageSize;
        setCurrentPage(nextPage);
        setPageSize(nextSize);
        fetchExecutableFiles(nextPage, nextSize);
    }

    return (
            <Space vertical={true} style={{width: "95%", margin: 30}} size="large">
                <Spin spinning={loading}>
                    {executableFiles.length > 0 && <Table
                            columns={columns}
                            dataSource={executableFiles.map(file => ({...file, key: file.id}))}
                            loading={loading}
                            pagination={{
                                current: currentPage,
                                pageSize: pageSize,
                                total: totalElements,
                                showSizeChanger: true,
                                pageSizeOptions: ["10", "20", "50", "100"],
                            }}
                            onChange={handleTableChange}
                            scroll={{x: "max-content"}}
                            key="executable-files-table"
                            rowKey="external_file_id"
                    />
                    }{executableFiles.length === 0 && !loading && t("ExecutableFiles.messages.noFiles", {defaultValue: "No executable files found"})}
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

