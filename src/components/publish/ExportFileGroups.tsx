import {useCallback, useEffect, useRef, useState} from "react";
import {Alert, Button, Form, Input, message, Modal, Popconfirm, Progress, Select, Space, Spin, Switch, Table, Typography} from "antd";
import type {ColumnsType} from "antd/es/table";
import type {SorterResult, SortOrder} from "antd/es/table/interface";
import {useNavigate} from "react-router-dom";
import {fileGroupAPI, publishAPI} from "../../services";
// Add missing import for editing payload
import type {
    FileGroupListResponse,
    FileGroupRequest,
    FileResponse,
    PublishAllFileGroupsResponse,
    PublishFileGroupRequest,
    PublishFileGroupResponse,
    PublishProgressResponse
} from "../../models";
import {FileTypeEnum} from "../../models";
import {useTranslation} from "react-i18next";
import {DeleteOutlined, EditOutlined, EyeOutlined, UploadOutlined} from "@ant-design/icons";

export function ExportFileGroups() {
    const [fileGroups, setFileGroups] = useState<FileGroupListResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const {t} = useTranslation();
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalElements, setTotalElements] = useState<number>(0);
    const [sortField, setSortField] = useState<string>("path");
    const [sortOrder, setSortOrder] = useState<SortOrder>("ascend");
    const [searchInput, setSearchInput] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
    const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
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
    // NEW: pageable state for candidates
    const [candidatePage, setCandidatePage] = useState<number>(1);
    const [candidateHasMore, setCandidateHasMore] = useState<boolean>(true);

    const navigate = useNavigate();

    // --- New publish-all related state & refs ---
    const PUBLISH_STATE_KEY = "vempain_publish_state";
    const [isPublishing, setIsPublishing] = useState<boolean>(false);
    const [publishInfo, setPublishInfo] = useState<PublishAllFileGroupsResponse | null>(null);
    const [publishProgress, setPublishProgress] = useState<PublishProgressResponse | null>(null);
    const pollRef = useRef<number | null>(null);
    // Track whether user has triggered a publish (single or all) - persisted so returning to page shows final status only if user actually triggered
    const [hasAnyPublishTriggered, setHasAnyPublishTriggered] = useState<boolean>(false);

    // Helper: persist publish state to localStorage
    const persistPublishState = (inProgress: boolean, progress?: PublishProgressResponse | null, info?: PublishAllFileGroupsResponse | null, triggered: boolean = false) => {
        const payload = {inProgress, progress: progress ?? null, info: info ?? null, triggered: triggered ?? false, updatedAt: new Date().toISOString()};
        try {
            localStorage.setItem(PUBLISH_STATE_KEY, JSON.stringify(payload));
        } catch (e) { /* ignore */
        }
    };

    const clearPersistedPublishState = () => {
        try {
            localStorage.removeItem(PUBLISH_STATE_KEY);
        } catch (e) { /* ignore */
        }
    };

    const startPollingProgress = () => {
        if (pollRef.current) return; // already polling
        pollRef.current = window.setInterval(async () => {
            try {
                const progress = await publishAPI.getPublishProgress();
                setPublishProgress(progress);
                // determine completion: consider finished when completed+failed >= total_groups
                const total = progress.total_groups ?? 0;
                const done = (progress.completed ?? 0) + (progress.failed ?? 0);
                const finished = total === 0 || done >= total;
                setIsPublishing(!finished);
                // persist 'triggered' only if we already know user triggered or publishInfo exists
                persistPublishState(!finished, progress, publishInfo, hasAnyPublishTriggered || !!publishInfo);
                if (finished) {
                    // stop polling
                    if (pollRef.current) {
                        clearInterval(pollRef.current);
                        pollRef.current = null;
                    }
                    // clear in-progress flag but keep final progress/info for display
                    persistPublishState(false, progress, publishInfo, hasAnyPublishTriggered || !!publishInfo);
                }
            } catch (err) {
                console.error("Failed to poll publish progress:", err);
                // don't stop polling on transient errors; they may recover
            }
        }, 2000);
    };

    const stopPollingProgress = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    };

    const fetchInitialPublishState = async () => {
        // Try to restore persisted state and also query server for current progress
        try {
            const raw = localStorage.getItem(PUBLISH_STATE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.info) setPublishInfo(parsed.info);
                if (parsed && parsed.progress) setPublishProgress(parsed.progress);
                if (parsed && parsed.inProgress) setIsPublishing(true);
                if (parsed && parsed.triggered) setHasAnyPublishTriggered(true);
            }
        } catch (e) {
            // ignore parse errors
        }

        try {
            const progress = await publishAPI.getPublishProgress();
            setPublishProgress(progress);
            const total = progress.total_groups ?? 0;
            const done = (progress.completed ?? 0) + (progress.failed ?? 0);
            const finished = total === 0 || done >= total;
            setIsPublishing(!finished);
            persistPublishState(!finished, progress, publishInfo, hasAnyPublishTriggered || !!publishInfo);
            if (!finished) startPollingProgress();
            else clearPersistedPublishState();
        } catch (err) {
            // no publish in progress or server error; keep persisted info if any
            console.debug("No active publish progress or cannot retrieve it yet", err);
        }
    };

    useEffect(() => {
        fetchInitialPublishState();
        return () => {
            stopPollingProgress();
        };
    }, []);

    // Function to trigger publishing all file groups
    const handlePublishAll = async () => {
        setIsPublishing(true);
        try {
            const resp = await publishAPI.publishAllFileGroups();
            setPublishInfo(resp);
            // mark that user triggered a publish
            setHasAnyPublishTriggered(true);
            message.success(t("PublishFileGroup.messages.publishScheduled", {defaultValue: "Publish scheduled"}));
            // show an alert as requested by user - we'll keep it rendered in the component
            persistPublishState(true, publishProgress ?? null, resp, true);
            // start polling for progress
            startPollingProgress();
        } catch (err) {
            console.error("Failed to publish all file groups:", err);
            message.error(t("PublishFileGroup.messages.publishError"));
            setIsPublishing(false);
            persistPublishState(false, null, null, false);
        }
    };

    const fetchFileGroups = useCallback((page: number = currentPage, size: number = pageSize) => {
        setLoading(true);
        fileGroupAPI.getFileGroups({
            page: page - 1,
            size,
            sort: sortField,
            direction: sortOrder === "descend" ? "DESC" : "ASC",
            search: searchTerm,
            caseSensitive
        })
                .then(response => {
                    if (response && response.content) {
                        setFileGroups(response.content);
                    } else {
                        setFileGroups([]);
                    }
                    setTotalElements(response.totalElements ?? 0);
                    setCurrentPage((response.page ?? (page - 1)) + 1);
                    setPageSize(response.size ?? size);
                })
                .catch(err => {
                    console.error("Failed to fetch file groups:", err);
                    message.error(t("PublishFileGroup.messages.fetchError"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [caseSensitive, currentPage, pageSize, searchTerm, sortField, sortOrder, t]);

    useEffect(() => {
        fetchFileGroups();
    }, [fetchFileGroups]);

    // Open modal and prefill fields from selected group
    function openPublishModal(group: FileGroupListResponse) {
        setSelectedGroup(group);
        setPublishModalOpen(true);
        form.setFieldsValue({
            gallery_name: group.group_name ?? "",
            gallery_description: group.description ?? ""
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
                                // Mark that a publish was triggered by user (single-group publish)
                                setHasAnyPublishTriggered(true);
                                persistPublishState(false, publishProgress ?? null, publishInfo ?? null, true);
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
            file_ids: []
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
        setCandidateHasMore(true);
        setCandidatePage(1);
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
                        file_ids: selectedFiles.map(f => (f as any).id),
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
            sorter: true,
            sortOrder: sortField === "id" ? sortOrder : undefined,
        },
        {
            title: t("FileGroups.columns.path.title"),
            dataIndex: 'path',
            key: 'path',
            sorter: true,
            sortOrder: sortField === "path" ? sortOrder : undefined,
            render: (text: string) => <span>{text}</span>,
        },
        {
            title: t("FileGroups.columns.group_name.title"),
            dataIndex: 'group_name',
            key: 'group_name',
            sorter: true,
            sortOrder: sortField === "group_name" ? sortOrder : undefined,
        },
        {
            title: t("FileGroups.columns.description.title", {defaultValue: "Description"}),
            dataIndex: 'description',
            key: 'description',
            sorter: true,
            sortOrder: sortField === "description" ? sortOrder : undefined,
        },
        {
            title: t("FileGroups.columns.file_count.title"),
            dataIndex: 'file_count',
            key: 'file_count',
            sorter: true,
            sortOrder: sortField === "file_count" ? sortOrder : undefined,
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

    const toBackendSortField = (field?: string): string => {
        switch (field) {
            case "id":
                return "id";
            case "group_name":
                return "group_name";
            case "description":
                return "description";
            case "file_count":
                return "file_count";
            case "path":
            default:
                return "path";
        }
    };

    function handleTableChange(
            pagination: { current?: number; pageSize?: number },
            _filters: Record<string, any>,
            sorter: SorterResult<FileGroupListResponse> | SorterResult<FileGroupListResponse>[]
    ) {
        const nextPage = pagination.current ?? 1;
        const nextSize = pagination.pageSize ?? pageSize;
        setCurrentPage(nextPage);
        setPageSize(nextSize);
        if (!Array.isArray(sorter) && sorter.field) {
            setSortField(toBackendSortField(sorter.field as string));
            setSortOrder(sorter.order ?? "ascend");
        } else {
            setSortField("path");
            setSortOrder("ascend");
        }
    }

    const handleSearch = (value: string) => {
        setSearchInput(value);
        setSearchTerm(value || undefined);
        setCurrentPage(1);
    };

    const handleCaseSensitiveChange = (checked: boolean) => {
        setCaseSensitive(checked);
        setCurrentPage(1);
    };

    return (
            <div className={"darkDiv"}>
                <Spin spinning={loading}>
                    <Space vertical={true} style={{width: "95%", margin: 30}} size="large">
                        <Typography.Title level={4}>{t("PublishFileGroup.header.title")}</Typography.Title>

                        <Space style={{width: "100%", justifyContent: "space-between", flexWrap: "wrap"}}>
                            <Space align="center" size={16} wrap>
                                <Input.Search
                                        placeholder={t("FileGroups.search.placeholder", {defaultValue: "Search file groups"})}
                                        allowClear
                                        value={searchInput}
                                        onChange={(event) => setSearchInput(event.target.value)}
                                        onSearch={handleSearch}
                                        style={{minWidth: 260}}
                                />
                                <Space align="center">
                                    {t("FileGroups.search.caseSensitive", {defaultValue: "Case sensitive"})}
                                    <Switch size="small" checked={caseSensitive} onChange={handleCaseSensitiveChange}/>
                                </Space>
                            </Space>
                            <Button type="primary" icon={<UploadOutlined/>} onClick={handlePublishAll} disabled={isPublishing}>
                                {t("PublishFileGroup.actions.publishAll", {defaultValue: "Publish all"})}
                            </Button>
                        </Space>

                        <Space style={{display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between'}}>
                            <Space>
                                {isPublishing && (
                                        <div style={{minWidth: 260}}>
                                            <Progress
                                                    percent={publishProgress?.total_groups
                                                            ? Math.round(((publishProgress.completed ?? 0) + (publishProgress.failed ?? 0)) / publishProgress.total_groups * 100)
                                                            : 0}
                                                    status={((publishProgress?.completed ?? 0) + (publishProgress?.failed ?? 0)) >= (publishProgress?.total_groups ?? 0) ? 'success' : 'active'}
                                                    strokeLinecap="square"
                                            />
                                        </div>
                                )}
                            </Space>

                            <div style={{textAlign: 'right'}}>
                                {publishInfo && hasAnyPublishTriggered && (
                                        <Alert type="info" showIcon
                                               message={t("PublishFileGroup.messages.scheduledInfo", {count: publishInfo.file_group_count})}/>
                                )}
                                {publishProgress && !isPublishing && hasAnyPublishTriggered && (((publishProgress.completed ?? 0) + (publishProgress.failed ?? 0)) >= (publishProgress.total_groups ?? 0)) && (
                                        <Alert type="success" showIcon
                                               message={t("PublishFileGroup.messages.publishCompleted", {defaultValue: "Publishing completed"})}/>
                                )}
                            </div>
                        </Space>

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
                        destroyOnHidden
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

                    <Space vertical={true} style={{width: "100%"}} size="middle">
                        <Space wrap>
                            <Select
                                    style={{minWidth: 220}}
                                    placeholder={t("FileGroups.modal.files.type.placeholder", {defaultValue: "Select file type"})}
                                    value={candidateType}
                                    onChange={(val) => {
                                        const nextType = val as FileTypeEnum;
                                        setCandidateType(nextType);
                                        fetchCandidatesByType(nextType);
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
                                    // NEW: dropdown footer to paginate
                                    dropdownRender={(menu) => (
                                            <div>
                                                {menu}
                                                <div style={{display: "flex", justifyContent: "center", padding: 8}}>
                                                    <Button
                                                            type="link"
                                                            onClick={() => candidateType && loadCandidatesPage(candidateType, candidatePage)}
                                                            disabled={!candidateHasMore || !candidateType}
                                                            loading={candidatesLoading}
                                                    >
                                                        {candidateHasMore
                                                                ? t("FileGroups.modal.files.loadMore", {defaultValue: "Load more"})
                                                                : t("FileGroups.modal.files.noMore", {defaultValue: "No more results"})}
                                                    </Button>
                                                </div>
                                            </div>
                                    )}
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
