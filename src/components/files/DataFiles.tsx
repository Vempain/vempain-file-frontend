import {Button, message, Modal, Popconfirm, Space, Spin, Table} from "antd";
import {useCallback, useEffect, useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import type {PagedRequest} from "@vempain/vempain-auth-frontend";
import {dataFileAPI} from "../../services";
import type {DataFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function DataFiles() {
    const {t} = useTranslation();
    const [loading, setLoading] = useState(true);
    const [dataFiles, setDataFiles] = useState<DataFileResponse[]>([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<DataFileResponse | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalElements, setTotalElements] = useState<number>(0);

    const fetchDataFiles = useCallback((page: number, size: number) => {
        setLoading(true);
        const pagedRequest: PagedRequest = {
            page: page - 1,
            size,
        };

        dataFileAPI.findAllPageable(pagedRequest)
                .then(response => {
                    if (response?.content) {
                        setDataFiles(response.content);
                    }

                    setTotalElements(response.total_elements ?? 0);
                    setCurrentPage(response.page + 1);
                    setPageSize(response.size);
                })
                .catch(err => {
                    console.error("Failed to fetch data files:", err);
                    message.error(t("DataFiles.messages.fetchError", {defaultValue: "Failed to load data files"}));
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [t]);

    useEffect(() => {
        fetchDataFiles(1, pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleDelete(id: number) {
        setLoading(true);
        dataFileAPI.delete(id)
                .then(() => {
                    message.success(t("DataFiles.messages.deleteSuccess", {defaultValue: "Data file deleted successfully"}));
                    fetchDataFiles(currentPage, pageSize);
                })
                .catch(err => {
                    console.error("Failed to delete data file:", err);
                    message.error(t("DataFiles.messages.deleteError", {defaultValue: "Failed to delete data file"}));
                })
                .finally(() => {
                    setLoading(false);
                });
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
                    <Popconfirm
                            title={t("DataFiles.popconfirm.delete.title", {defaultValue: "Delete this data file"})}
                            description={t("DataFiles.popconfirm.delete.description", {defaultValue: "Are you sure you want to delete this data file?"})}
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
        fetchDataFiles(nextPage, nextSize);
    }

    return (
            <Space vertical={true} style={{width: "95%", margin: 30}} size="large">
                <Spin spinning={loading}>
                    {dataFiles.length > 0 && <Table
                            columns={columns}
                            dataSource={dataFiles.map(file => ({...file, key: file.id}))}
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
                            key="data-files-table"
                            rowKey="external_file_id"
                    />
                    }{dataFiles.length === 0 && !loading && t("DataFiles.messages.noFiles", {defaultValue: "No data files found"})}
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

