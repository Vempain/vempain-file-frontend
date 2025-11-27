import {Button, message, Modal, Popconfirm, Space, Spin, Table} from "antd";
import {useEffect, useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {imageFileAPI} from "../../services";
import type {ImageFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function ImageFiles() {
    const {t} = useTranslation();
    const [loading, setLoading] = useState(true);
    const [imageFiles, setImageFiles] = useState<ImageFileResponse[]>([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<ImageFileResponse | null>(null);
    // Add paging state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalElements, setTotalElements] = useState<number>(0);

    function fetchImageFiles(page: number = currentPage, size: number = pageSize) {
        setLoading(true);
        imageFileAPI.findAllPageable(page - 1, size)
                .then(response => {
                    if (response && response.content) {
                        setImageFiles(response.content);
                    }

                    setTotalElements(response.totalElements ?? 0);
                    setCurrentPage(response.page + 1);
                    setPageSize(response.size);
                })
                .catch(err => {
                    console.error("Failed to fetch image files:", err);
                    message.error(t("ImageFiles.messages.fetchError"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    useEffect(() => {
        fetchImageFiles(1, pageSize);
    }, []);

    function handleDelete(id: number) {
        setLoading(true);
        imageFileAPI.delete(id)
                .then(_ => {
                    message.success(t("ImageFiles.messages.deleteSuccess"));
                    fetchImageFiles();
                })
                .catch(err => {
                    console.error("Failed to delete image file:", err);
                    message.error(t("ImageFiles.messages.deleteError"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    const columns: ColumnsType<ImageFileResponse> = [
        filenameColumn<ImageFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }, t),
        filePathColumn<ImageFileResponse>(t),
        fileSizeColumn<ImageFileResponse>(t),
        mimetypeColumn<ImageFileResponse>(t),
        {
            title: t("ImageFiles.columns.width.title"),
            dataIndex: 'width',
            key: 'width',
            sorter: (a: ImageFileResponse, b: ImageFileResponse) => a.width - b.width,
        },
        {
            title: t("ImageFiles.columns.height.title"),
            dataIndex: 'height',
            key: 'height',
            sorter: (a: ImageFileResponse, b: ImageFileResponse) => a.height - b.height,
        },
        {
            title: t("ImageFiles.columns.dpi.title"),
            dataIndex: 'dpi',
            key: 'dpi',
        },
        {
            title: t("ImageFiles.columns.color_depth.title"),
            dataIndex: 'color_depth',
            key: 'color_depth',
        },
        {
            title: t("ImageFiles.columns.group_label.title"),
            dataIndex: 'group_label',
            key: 'group_label',
        },
        createdColumn<ImageFileResponse>(t),
        {
            title: t("ImageFiles.columns.actions.title"),
            key: 'actions',
            render: (_: undefined, record: ImageFileResponse) => (
                    <Popconfirm
                            title={t("ImageFiles.popconfirm.delete.title")}
                            description={t("ImageFiles.popconfirm.delete.description")}
                            onConfirm={() => handleDelete(record.id)}
                            okText={t("Common.popconfirm.yes")}
                            cancelText={t("Common.popconfirm.no")}
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
        fetchImageFiles(nextPage, nextSize);
    }

    return (
            <Space vertical={true} style={{width: "100%", margin: 30}} size="large">
                <Spin spinning={loading}>
                    {imageFiles.length > 0 && <Table
                            columns={columns}
                            dataSource={imageFiles.map(file => ({...file, key: file.id}))}
                            loading={loading}
                            pagination={{
                                current: currentPage,
                                pageSize: pageSize,
                                total: totalElements,
                                showSizeChanger: true,
                                pageSizeOptions: ['10', '20', '50', '100'],
                            }}
                            onChange={handleTableChange}
                            scroll={{x: 'max-content'}}
                            key="image-files-table"
                            rowKey="external_file_id"
                    />
                    }{imageFiles.length === 0 && !loading && t("ImageFiles.messages.noFiles")}
                </Spin>
                <Modal
                        open={detailsOpen}
                        onCancel={() => setDetailsOpen(false)}
                        afterClose={() => setSelectedFile(null)}
                        footer={null}
                        destroyOnHidden
                        maskClosable
                        title={selectedFile?.filename || t("Common.modal.fileDetailsTitle")}
                        width={720}
                >
                    {selectedFile != null && <FileDetails file={selectedFile}/>}
                </Modal>
            </Space>
    );
}