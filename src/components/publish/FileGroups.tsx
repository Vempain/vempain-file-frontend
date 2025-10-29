import {useEffect, useState} from "react";
import {Button, Form, Input, message, Modal, Popconfirm, Space, Spin, Table, Typography} from "antd";
import {useNavigate} from "react-router-dom";
import {fileGroupAPI, publishAPI} from "../../services";
import type {FileGroupListResponse, PublishFileGroupRequest, PublishFileGroupResponse} from "../../models";
import {useTranslation} from "react-i18next";
import {DeleteOutlined, EyeOutlined, UploadOutlined} from "@ant-design/icons";
import type {ColumnsType} from "antd/es/table";

export function FileGroups() {
    const [fileGroups, setFileGroups] = useState<FileGroupListResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const {t} = useTranslation();
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalElements, setTotalElements] = useState<number>(0);
    // New modal/form state
    const [publishModalOpen, setPublishModalOpen] = useState<boolean>(false);
    const [publishSubmitting, setPublishSubmitting] = useState<boolean>(false);
    const [selectedGroup, setSelectedGroup] = useState<FileGroupListResponse | null>(null);
    const [form] = Form.useForm();

    const navigate = useNavigate();

    function fetchFileGroups(page: number = currentPage, size: number = pageSize) {
        setLoading(true);
        fileGroupAPI.findAllPageable(page - 1, size)
                .then(response => {
                    if (response && response.content) {
                        setFileGroups(response.content);
                    } else {
                        setFileGroups([]);
                    }
                    setTotalElements(response.totalElements ?? 0);
                    setCurrentPage(response.page + 1);
                    setPageSize(response.size);
                })
                .catch(err => {
                    console.error("Failed to fetch file groups:", err);
                    message.error(t("PublishFileGroup.messages.fetchError"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    useEffect(() => {
        fetchFileGroups(1, pageSize);
    }, []);

    // Open modal and prefill fields from selected group
    function openPublishModal(group: FileGroupListResponse) {
        setSelectedGroup(group);
        setPublishModalOpen(true);
        form.setFieldsValue({
            gallery_name: group.group_name ?? "",
            gallery_description: ""
        });
    }

    // Close modal and reset form
    function closePublishModal() {
        setPublishModalOpen(false);
        setSelectedGroup(null);
        form.resetFields();
    }

    // Submit publish with extra fields
    function submitPublish() {
        form.validateFields()
                .then(values => {
                    if (!selectedGroup) return;
                    setPublishSubmitting(true);
                    const request: PublishFileGroupRequest = {
                        file_group_id: selectedGroup.id,
                        gallery_name: values.gallery_name || null,
                        gallery_description: values.gallery_description || null
                    };
                    publishAPI.publishFileGroup(request)
                            .then((result: PublishFileGroupResponse[]) => {
                                const count = result[0]?.files_to_publish_count ?? 0;
                                message.success(t("PublishFileGroup.messages.publishSuccess", {count}));
                                // Refresh page list (counts might have changed)
                                fetchFileGroups(currentPage, pageSize);
                                closePublishModal();
                            })
                            .catch(err => {
                                console.error("Failed to publish file group:", err);
                                message.error(t("PublishFileGroup.messages.publishError"));
                            })
                            .finally(() => setPublishSubmitting(false));
                })
                .catch(() => {
                    // validation errors are shown by antd Form
                });
    }

    function handleDelete(groupId: number) {
        setLoading(true);
        fileGroupAPI.delete(groupId)
                .then(() => {
                    message.success(t("PublishFileGroup.messages.deleteSuccess"));
                    // Refresh list after delete
                    // If deleting the last item on the last page, backend may shift pages; fetch current page
                    fetchFileGroups(currentPage, pageSize);
                })
                .catch(err => {
                    console.error("Failed to delete file group:", err);
                    message.error(t("PublishFileGroup.messages.deleteError"));
                })
                .finally(() => setLoading(false));
    }

    function handleShow(groupId: number) {
        // navigate to the ShowFileGroup route; App.tsx already has routing for it
        navigate(`/file-groups/${groupId}`);
    }

    const columns: ColumnsType<FileGroupListResponse> = [
        {
            title: t("FileGroups.columns.id.title"),
            dataIndex: 'id',
            key: 'id',
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: t("FileGroups.columns.path.title"),
            dataIndex: 'path',
            key: 'path',
            sorter: (a, b) => a.path.localeCompare(b.path),
            render: (text: string) => <span>{text}</span>,
        },
        {
            title: t("FileGroups.columns.group_name.title"),
            dataIndex: 'group_name',
            key: 'group_name',
            sorter: (a, b) => a.group_name.localeCompare(b.group_name),
        },
        {
            title: t("FileGroups.columns.file_count.title"),
            dataIndex: 'file_count',
            key: 'file_count',
            sorter: (a, b) => a.file_count - b.file_count,
        },
        {
            title: t("FileGroups.columns.actions.title"),
            key: 'actions',
            render: (_: undefined, record: FileGroupListResponse) => (
                    <Space>
                        <Button
                                type="primary"
                                icon={<UploadOutlined/>}
                                onClick={() => openPublishModal(record)}
                                loading={loading}
                        >
                            {t("PublishFileGroup.actions.publish")}
                        </Button>
                        <Button
                                icon={<EyeOutlined/>}
                                onClick={() => handleShow(record.id)}
                        >
                            {t("PublishFileGroup.actions.show")}
                        </Button>
                        <Popconfirm
                                title={t("PublishFileGroup.popconfirm.delete.title")}
                                description={t("PublishFileGroup.popconfirm.delete.description")}
                                onConfirm={() => handleDelete(record.id)}
                                okText={t("Common.popconfirm.yes")}
                                cancelText={t("Common.popconfirm.no")}
                        >
                            <Button danger icon={<DeleteOutlined/>}/>
                        </Popconfirm>
                    </Space>
            ),
        },
    ];

    function handleTableChange(pagination: { current?: number; pageSize?: number }) {
        const nextPage = pagination.current ?? 1;
        const nextSize = pagination.pageSize ?? pageSize;
        setCurrentPage(nextPage);
        setPageSize(nextSize);
        fetchFileGroups(nextPage, nextSize);
    }

    return (
            <div className={"darkDiv"}>
                <Spin spinning={loading}>
                    <Space direction="vertical" style={{width: "95%", margin: 30}} size="large">
                        <Typography.Title level={4}>{t("PublishFileGroup.header.title")}</Typography.Title>
                        <Table
                                columns={columns}
                                dataSource={fileGroups.map(group => ({...group, key: group.id}))}
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
                                rowKey="id"
                        />
                    </Space>
                </Spin>

                {/* Publish modal */}
                <Modal
                        open={publishModalOpen}
                        title={t("PublishFileGroup.modal.title")}
                        onOk={submitPublish}
                        onCancel={closePublishModal}
                        confirmLoading={publishSubmitting}
                        destroyOnClose
                >
                    <Form layout="vertical" form={form}>
                        <Form.Item
                                name="gallery_name"
                                label={t("PublishFileGroup.modal.galleryName.label")}
                        >
                            <Input placeholder={t("PublishFileGroup.modal.galleryName.placeholder")}/>
                        </Form.Item>
                        <Form.Item
                                name="gallery_description"
                                label={t("PublishFileGroup.modal.galleryDescription.label")}
                        >
                            <Input.TextArea
                                    rows={4}
                                    placeholder={t("PublishFileGroup.modal.galleryDescription.placeholder")}
                            />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
    );
}
