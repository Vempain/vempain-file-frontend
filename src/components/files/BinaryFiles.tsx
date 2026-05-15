import {Button, message, Modal, Popconfirm, Space, Spin, Table} from "antd";
import {useCallback, useEffect, useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import type {PagedRequest} from "@vempain/vempain-auth-frontend";
import {binaryFileAPI} from "../../services";
import type {BinaryFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function BinaryFiles() {
    const {t} = useTranslation();
    const [loading, setLoading] = useState(true);
    const [binaryFiles, setBinaryFiles] = useState<BinaryFileResponse[]>([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<BinaryFileResponse | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalElements, setTotalElements] = useState<number>(0);

    const fetchBinaryFiles = useCallback((page: number, size: number) => {
        setLoading(true);
        const pagedRequest: PagedRequest = {
            page: page - 1,
            size,
        };

        binaryFileAPI.findAllPageable(pagedRequest)
                .then(response => {
                    if (response?.content) {
                        setBinaryFiles(response.content);
                    }

                    setTotalElements(response.total_elements ?? 0);
                    setCurrentPage(response.page + 1);
                    setPageSize(response.size);
                })
                .catch(err => {
                    console.error("Failed to fetch binary files:", err);
                    message.error(t("BinaryFiles.messages.fetchError", {defaultValue: "Failed to load binary files"}));
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [t]);

    useEffect(() => {
        fetchBinaryFiles(1, pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleDelete(id: number) {
        setLoading(true);
        binaryFileAPI.delete(id)
                .then(() => {
                    message.success(t("BinaryFiles.messages.deleteSuccess", {defaultValue: "Binary file deleted successfully"}));
                    fetchBinaryFiles(currentPage, pageSize);
                })
                .catch(err => {
                    console.error("Failed to delete binary file:", err);
                    message.error(t("BinaryFiles.messages.deleteError", {defaultValue: "Failed to delete binary file"}));
                })
                .finally(() => {
                    setLoading(false);
                });
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

    function handleTableChange(pagination: { current?: number; pageSize?: number }) {
        const nextPage = pagination.current ?? 1;
        const nextSize = pagination.pageSize ?? pageSize;
        setCurrentPage(nextPage);
        setPageSize(nextSize);
        fetchBinaryFiles(nextPage, nextSize);
    }

    return (
            <Space vertical={true} style={{width: "95%", margin: 30}} size="large">
                <Spin spinning={loading}>
                    {binaryFiles.length > 0 && <Table
                            columns={columns}
                            dataSource={binaryFiles.map(file => ({...file, key: file.id}))}
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
                            key="binary-files-table"
                            rowKey="external_file_id"
                    />
                    }{binaryFiles.length === 0 && !loading && t("BinaryFiles.messages.noFiles", {defaultValue: "No binary files found"})}
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

