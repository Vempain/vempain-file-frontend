import {Button, message, Modal, Popconfirm, Space, Spin, Table} from "antd";
import {useCallback, useEffect, useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import type {PagedRequest} from "@vempain/vempain-auth-frontend";
import {iconFileAPI} from "../../services";
import type {IconFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function IconFiles() {
    const {t} = useTranslation();
    const [loading, setLoading] = useState(true);
    const [iconFiles, setIconFiles] = useState<IconFileResponse[]>([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<IconFileResponse | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalElements, setTotalElements] = useState<number>(0);

    const fetchIconFiles = useCallback((page: number, size: number) => {
        setLoading(true);
        const pagedRequest: PagedRequest = {
            page: page - 1,
            size,
        };

        iconFileAPI.findAllPageable(pagedRequest)
                .then(response => {
                    if (response?.content) {
                        setIconFiles(response.content);
                    }

                    setTotalElements(response.total_elements ?? 0);
                    setCurrentPage(response.page + 1);
                    setPageSize(response.size);
                })
                .catch(err => {
                    console.error("Failed to fetch icon files:", err);
                    message.error(t("IconFiles.messages.fetchError", {defaultValue: "Failed to load icon files"}));
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [t]);

    useEffect(() => {
        fetchIconFiles(1, pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleDelete(id: number) {
        setLoading(true);
        iconFileAPI.delete(id)
                .then(() => {
                    message.success(t("IconFiles.messages.deleteSuccess", {defaultValue: "Icon file deleted successfully"}));
                    fetchIconFiles(currentPage, pageSize);
                })
                .catch(err => {
                    console.error("Failed to delete icon file:", err);
                    message.error(t("IconFiles.messages.deleteError", {defaultValue: "Failed to delete icon file"}));
                })
                .finally(() => {
                    setLoading(false);
                });
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
                    <Popconfirm
                            title={t("IconFiles.popconfirm.delete.title", {defaultValue: "Delete this icon file"})}
                            description={t("IconFiles.popconfirm.delete.description", {defaultValue: "Are you sure you want to delete this icon file?"})}
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
        fetchIconFiles(nextPage, nextSize);
    }

    return (
            <Space vertical={true} style={{width: "95%", margin: 30}} size="large">
                <Spin spinning={loading}>
                    {iconFiles.length > 0 && <Table
                            columns={columns}
                            dataSource={iconFiles.map(file => ({...file, key: file.id}))}
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
                            key="icon-files-table"
                            rowKey="external_file_id"
                    />
                    }{iconFiles.length === 0 && !loading && t("IconFiles.messages.noFiles", {defaultValue: "No icon files found"})}
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

