import {useEffect, useState} from "react";
import {Button, Form, Input, message, Modal, Popconfirm, Select, Space, Spin, Table, Typography} from "antd";
import {useNavigate} from "react-router-dom";
import {archiveFileAPI, audioFileAPI, documentFileAPI, fileGroupAPI, imageFileAPI, publishAPI, vectorFileAPI, videoFileAPI} from "../../services";
// Add missing import for editing payload
import type {FileGroupListResponse, FileGroupRequest, FileResponse, PublishFileGroupRequest, PublishFileGroupResponse} from "../../models";
import {useTranslation} from "react-i18next";
import {DeleteOutlined, EditOutlined, EyeOutlined, UploadOutlined} from "@ant-design/icons";
import type {ColumnsType} from "antd/es/table";
import {FileTypeEnum} from "../../models/FileTypeEnum";

export function ExportFileGroups() {
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
    // Edit modal state
    const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
    const [editForm] = Form.useForm<FileGroupRequest>();

    // File selection state for edit modal
    const [selectedFiles, setSelectedFiles] = useState<FileResponse[]>([]);
    const [candidateType, setCandidateType] = useState<FileTypeEnum | undefined>(undefined);
    const [candidates, setCandidates] = useState<FileResponse[]>([]);
    const [candidatesLoading, setCandidatesLoading] = useState<boolean>(false);
    const [candidateSelectedIds, setCandidateSelectedIds] = useState<number[]>([]);

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
        navigate(`/publishing/file-groups/${groupId}`);
    }

    // Open edit modal and populate form
    function openEditModal(group: FileGroupListResponse) {
        setSelectedGroup(group);
        setEditModalOpen(true);
        editForm.setFieldsValue({
            id: group.id,
            path: group.path ?? "",
            group_name: group.group_name ?? "",
            description: group.description ?? "",
            fileIds: []
        } as unknown as FileGroupRequest);
        // preload existing files
        fileGroupAPI.findById(group.id)
                .then(full => setSelectedFiles((full as any).files ?? []))
                .catch(err => {
                    console.error("Failed to load group files:", err);
                    message.error(t("FileGroups.messages.fetchError", {defaultValue: "Failed to load file group details"}));
                });
        setCandidateType(undefined);
        setCandidates([]);
        setCandidateSelectedIds([]);
    }

    function closeEditModal() {
        setEditModalOpen(false);
        setSelectedGroup(null);
        editForm.resetFields();
    }

    function submitEdit() {
        editForm.validateFields()
                .then(values => {
                    const payload: FileGroupRequest = {
                        id: values.id,
                        path: values.path?.trim() ?? "",
                        group_name: values.group_name?.trim() ?? "",
                        description: values.description?.trim() ?? "",
                        fileIds: selectedFiles.map(f => (f as any).id),
                    };
                    return fileGroupAPI.update(payload)
                            .then(() => {
                                message.success(
                                        // reuse FileGroups i18n keys if available
                                        "FileGroups.messages.updateSuccess" in ({} as any)
                                                ? (t("FileGroups.messages.updateSuccess") as any)
                                                : t("Common.messages.saved", {defaultValue: "Saved"})
                                );
                                closeEditModal();
                                fetchFileGroups(currentPage, pageSize);
                            })
                            .catch(err => {
                                console.error("Failed to update file group:", err);
                                message.error(
                                        "FileGroups.messages.updateError" in ({} as any)
                                                ? (t("FileGroups.messages.updateError") as any)
                                                : t("Common.messages.saveFailed", {defaultValue: "Save failed"})
                                );
                            });
                });
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
            title: t("FileGroups.columns.description.title", {defaultValue: "Description"}),
            dataIndex: 'description',
            key: 'description',
            sorter: (a, b) => (a.description ?? "").localeCompare(b.description ?? ""),
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
                                icon={<EditOutlined/>}
                                onClick={() => openEditModal(record)}
                        >
                            {t("FileGroups.actions.edit", {defaultValue: "Edit"})}
                        </Button>
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

    const getServiceForType = (type: FileTypeEnum | undefined) => {
        if (!type) return undefined;
        const map: Record<FileTypeEnum, any> = {
            [FileTypeEnum.ARCHIVE]: archiveFileAPI,
            [FileTypeEnum.AUDIO]: audioFileAPI,
            [FileTypeEnum.DOCUMENT]: documentFileAPI,
            [FileTypeEnum.IMAGE]: imageFileAPI,
            [FileTypeEnum.VECTOR]: vectorFileAPI,
            [FileTypeEnum.VIDEO]: videoFileAPI,
            [FileTypeEnum.BINARY]: undefined,
            [FileTypeEnum.DATA]: undefined,
            [FileTypeEnum.EXECUTABLE]: undefined,
            [FileTypeEnum.FONT]: undefined,
            [FileTypeEnum.ICON]: undefined,
            [FileTypeEnum.INTERACTIVE]: undefined,
            [FileTypeEnum.THUMB]: undefined,
            [FileTypeEnum.UNKNOWN]: undefined,
        } as any;
        return map[type];
    };

    const typeOptions = [
        FileTypeEnum.ARCHIVE,
        FileTypeEnum.AUDIO,
        FileTypeEnum.DOCUMENT,
        FileTypeEnum.IMAGE,
        FileTypeEnum.VECTOR,
        FileTypeEnum.VIDEO,
    ].map(v => ({value: v, label: t(`FileTypeEnum.${v.toLowerCase()}`, {defaultValue: v})}));

    const fetchCandidatesByType = (type: FileTypeEnum | undefined) => {
        setCandidates([]);
        setCandidateSelectedIds([]);
        if (!type) return;
        const svc = getServiceForType(type);
        if (!svc) return;
        setCandidatesLoading(true);
        svc.findAll()
                .then((res: any) => {
                    const list: FileResponse[] = Array.isArray(res) ? res : (res?.content ?? []);
                    setCandidates(list ?? []);
                })
                .catch((err: any) => {
                    console.error("Failed to load files by type:", err);
                    message.error(t("FileGroups.messages.fetchError", {defaultValue: "Failed to load files"}));
                })
                .finally(() => setCandidatesLoading(false));
    };

    const addSelectedCandidates = () => {
        if (candidateSelectedIds.length === 0) return;
        const toAdd = candidates.filter(f => candidateSelectedIds.includes((f as any).id));
        const existingIds = new Set(selectedFiles.map(f => (f as any).id));
        const merged = [...selectedFiles, ...toAdd.filter(f => !existingIds.has((f as any).id))];
        setSelectedFiles(merged);
        setCandidateSelectedIds([]);
    };

    const removeSelectedFile = (id: number) => {
        setSelectedFiles(prev => prev.filter(f => (f as any).id !== id));
    };

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

                {/* Edit modal */}
                <Modal
                        open={editModalOpen}
                        title={t("FileGroups.modal.edit.title", {defaultValue: "Edit file group"})}
                        okText={t("Common.modal.save", {defaultValue: "Save"})}
                        cancelText={t("Common.modal.cancel", {defaultValue: "Cancel"})}
                        onOk={submitEdit}
                        onCancel={closeEditModal}
                        destroyOnClose
                        maskClosable
                        width={900}
                >
                    <Form layout="vertical" form={editForm}>
                        <Form.Item name="id" hidden>
                            <Input type="hidden"/>
                        </Form.Item>
                        <Form.Item
                                label={t("FileGroups.modal.path.label", {defaultValue: "Path"})}
                                name="path"
                                rules={[{required: true, message: t("FileGroups.modal.path.validation.required", {defaultValue: "Path is required"})}]}
                        >
                            <Input placeholder={t("FileGroups.modal.path.placeholder", {defaultValue: "Enter path"})}/>
                        </Form.Item>
                        <Form.Item
                                label={t("FileGroups.modal.group_name.label", {defaultValue: "Group name"})}
                                name="group_name"
                                rules={[{
                                    required: true,
                                    message: t("FileGroups.modal.group_name.validation.required", {defaultValue: "Group name is required"})
                                }]}
                        >
                            <Input placeholder={t("FileGroups.modal.group_name.placeholder", {defaultValue: "Enter group name"})}/>
                        </Form.Item>
                        <Form.Item
                                label={t("FileGroups.modal.description.label", {defaultValue: "Description"})}
                                name="description"
                        >
                            <Input.TextArea placeholder={t("FileGroups.modal.description.placeholder", {defaultValue: "Enter description"})} rows={3}/>
                        </Form.Item>
                    </Form>

                    <Typography.Title level={5} style={{marginTop: 8}}>
                        {t("FileGroups.modal.files.title", {defaultValue: "Files in group"})}
                    </Typography.Title>

                    <Space direction="vertical" style={{width: "100%"}} size="middle">
                        <Space wrap>
                            <Select
                                    style={{minWidth: 220}}
                                    placeholder={t("FileGroups.modal.files.type.placeholder", {defaultValue: "Select file type"})}
                                    value={candidateType}
                                    onChange={(val) => {
                                        setCandidateType(val as FileTypeEnum);
                                        fetchCandidatesByType(val as FileTypeEnum);
                                    }}
                                    options={typeOptions}
                            />
                            <Select
                                    mode="multiple"
                                    allowClear
                                    loading={candidatesLoading}
                                    style={{minWidth: 360}}
                                    placeholder={t("FileGroups.modal.files.select.placeholder", {defaultValue: "Select files to add"})}
                                    value={candidateSelectedIds}
                                    onChange={(vals: number[]) => setCandidateSelectedIds(vals)}
                                    options={(Array.isArray(candidates) ? candidates : []).map(f => ({
                                        value: (f as any).id,
                                        label: `${(f as any).filename} — ${(f as any).file_path}`,
                                    }))}
                                    optionFilterProp="label"
                                    maxTagCount="responsive"
                            />
                            <Button type="primary" onClick={addSelectedCandidates} disabled={candidateSelectedIds.length === 0}>
                                {t("FileGroups.modal.files.add", {defaultValue: "Add selected"})}
                            </Button>
                        </Space>

                        <Table<FileResponse>
                                size="small"
                                pagination={false}
                                dataSource={selectedFiles.map(f => ({...f, key: (f as any).id}))}
                                columns={[
                                    {
                                        title: t("FileGroups.columns.filename.title", {defaultValue: "Filename"}),
                                        dataIndex: "filename",
                                        key: "filename",
                                    },
                                    {
                                        title: t("FileGroups.columns.file_path.title", {defaultValue: "File path"}),
                                        dataIndex: "file_path",
                                        key: "file_path",
                                    },
                                    {
                                        title: t("FileGroups.modal.files.actions.title", {defaultValue: "Actions"}),
                                        key: "actions",
                                        width: 100,
                                        render: (_: any, record: FileResponse) => (
                                                <Popconfirm
                                                        title={t("FileGroups.modal.files.remove.title", {defaultValue: "Remove file"})}
                                                        description={t("FileGroups.modal.files.remove.description", {defaultValue: "Remove this file from the group?"})}
                                                        okText={t("Common.popconfirm.yes", {defaultValue: "Yes"})}
                                                        cancelText={t("Common.popconfirm.no", {defaultValue: "No"})}
                                                        onConfirm={() => removeSelectedFile((record as any).id)}
                                                >
                                                    <Button danger icon={<DeleteOutlined/>}/>
                                                </Popconfirm>
                                        )
                                    }
                                ]}
                                rowKey={(f) => (f as any).id}
                        />
                    </Space>
                </Modal>
            </div>
    );
}
