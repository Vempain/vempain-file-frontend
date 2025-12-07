import {Button, Form, Input, message, Modal, Popconfirm, Select, Space, Spin, Switch, Table, Typography} from "antd";
import {DeleteOutlined, EditOutlined, PlusOutlined, UploadOutlined} from "@ant-design/icons";
import {useCallback, useEffect, useMemo, useState} from "react";
import type {ColumnsType} from "antd/es/table";
import type {SorterResult, SortOrder} from "antd/es/table/interface";
import {archiveFileAPI, audioFileAPI, documentFileAPI, fileGroupAPI, imageFileAPI, publishAPI, vectorFileAPI, videoFileAPI} from "../../services";
import type {FileGroupListResponse, FileGroupRequest, FileGroupResponse, FileResponse, PublishFileGroupRequest, PublishFileGroupResponse} from "../../models";
import {FileTypeEnum} from "../../models";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";
import type {PagedRequest} from "@vempain/vempain-auth-frontend";

export function FileGroups() {
    const {t} = useTranslation();

    // Table state
    const [loading, setLoading] = useState<boolean>(true);
    const [groups, setGroups] = useState<FileGroupListResponse[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalElements, setTotalElements] = useState<number>(0);
    const [sortField, setSortField] = useState<string>("path");
    const [sortOrder, setSortOrder] = useState<SortOrder>("ascend");
    const [searchInput, setSearchInput] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
    const [caseSensitive, setCaseSensitive] = useState<boolean>(false);

    // Edit/Create modal state
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingGroup, setEditingGroup] = useState<FileGroupListResponse | null>(null);
    const [form] = Form.useForm<FileGroupRequest>();
    const [publishModalOpen, setPublishModalOpen] = useState<boolean>(false);
    const [publishSubmitting, setPublishSubmitting] = useState<boolean>(false);
    const [publishingGroup, setPublishingGroup] = useState<FileGroupListResponse | null>(null);
    const [publishForm] = Form.useForm();

    // Expanded rows: cache files per group id
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
    const [groupFiles, setGroupFiles] = useState<Record<number, { loading: boolean; files: FileResponse[] }>>({});

    // File details modal
    const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
    const [selectedFile, setSelectedFile] = useState<FileResponse | null>(null);

    // File selection state for modal
    const [selectedFiles, setSelectedFiles] = useState<FileResponse[]>([]);
    const [loadingSelectedFiles, setLoadingSelectedFiles] = useState<boolean>(false);
    const [candidateType, setCandidateType] = useState<FileTypeEnum | undefined>(undefined);
    const [candidates, setCandidates] = useState<FileResponse[]>([]);
    const [candidatesLoading, setCandidatesLoading] = useState<boolean>(false);
    const [candidateSelectedIds, setCandidateSelectedIds] = useState<number[]>([]);
    // NEW: pageable state for candidates
    const [candidatePage, setCandidatePage] = useState<number>(1);
    const candidatePageSize = 50;
    const [candidateHasMore, setCandidateHasMore] = useState<boolean>(true);

    // Helper: service per file type
    const getServiceForType = (type: FileTypeEnum | undefined) => {
        if (!type) return undefined;
        const map: Record<FileTypeEnum, any> = {
            [FileTypeEnum.ARCHIVE]: archiveFileAPI,
            [FileTypeEnum.AUDIO]: audioFileAPI,
            [FileTypeEnum.DOCUMENT]: documentFileAPI,
            [FileTypeEnum.IMAGE]: imageFileAPI,
            [FileTypeEnum.VECTOR]: vectorFileAPI,
            [FileTypeEnum.VIDEO]: videoFileAPI,
            // Types without dedicated listing are omitted on purpose:
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

    // NEW: load candidates by page using pageable API
    const loadCandidatesPage = (type: FileTypeEnum, page: number) => {
        const svc = getServiceForType(type);
        if (!svc) return;
        setCandidatesLoading(true);
        svc.findAllPageable(page - 1, candidatePageSize)
                .then((res: { content?: FileResponse[]; last?: boolean; page?: number }) => {
                    const list = res?.content ?? [];
                    setCandidates(prev => (page === 1 ? list : [...prev, ...list]));
                    setCandidateHasMore(!(res?.last ?? true));
                    setCandidatePage(page + 1);
                })
                .catch((err: any) => {
                    console.error("Failed to load files by type:", err);
                    message.error(t("FileGroups.messages.fetchError", {defaultValue: "Failed to load files"}));
                })
                .finally(() => setCandidatesLoading(false));
    };

    // REPLACED: fetchCandidatesByType now resets & loads first page
    const fetchCandidatesByType = (type: FileTypeEnum | undefined) => {
        setCandidates([]);
        setCandidateSelectedIds([]);
        setCandidateHasMore(true);
        setCandidatePage(1);
        if (!type) return;
        loadCandidatesPage(type, 1);
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

    const fetchGroups = useCallback((page: number = currentPage, size: number = pageSize) => {
        setLoading(true);

        const pagedRequest: PagedRequest = {
            page: page - 1,
            size: size,
            sort_by: sortField,
            direction: sortOrder === "descend" ? "DESC" : "ASC",
            search: searchTerm,
            case_sensitive: caseSensitive
        };
        fileGroupAPI.getFileGroups(pagedRequest)
                .then((res) => {
                    setGroups(res.content ?? []);
                    setTotalElements(res.total_elements ?? 0);
                    setCurrentPage((res.page ?? (page - 1)) + 1);
                    setPageSize(res.size ?? size);
                })
                .catch((err) => {
                    console.error("Failed to fetch file groups:", err);
                    message.error(t("FileGroups.messages.fetchError", {defaultValue: "Failed to load file groups"}));
                })
                .finally(() => setLoading(false));
    }, [caseSensitive, currentPage, pageSize, searchTerm, sortField, sortOrder, t]);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    function openCreateModal() {
        setEditingGroup(null);
        form.resetFields();
        form.setFieldsValue({
            id: 0,
            path: "",
            group_name: "",
            description: "",
            files: []
        } as unknown as FileGroupRequest);
        setSelectedFiles([]);
        setCandidateType(undefined);
        setCandidates([]);
        setCandidateSelectedIds([]);
        setCandidateHasMore(true);
        setCandidatePage(1);
        setIsModalOpen(true);
    }

    function openEditModal(record: FileGroupListResponse) {
        setEditingGroup(record);
        setLoadingSelectedFiles(true);
        form.setFieldsValue({
            id: (record as any).id ?? 0,
            path: (record as any).path ?? "",
            group_name: (record as any).group_name ?? "",
            description: (record as any).description ?? "",
            files: []
        } as unknown as FileGroupRequest);
        setSelectedFiles([]);
        setCandidateType(undefined);
        setCandidates([]);
        setCandidateSelectedIds([]);
        setCandidateHasMore(true);
        setCandidatePage(1);
        // Load full group to preload files
        fileGroupAPI.findById((record as any).id)
                .then((full: FileGroupResponse) => setSelectedFiles(full.files ?? []))
                .catch((err) => {
                    console.error("Failed to fetch group files:", err);
                    message.error(t("FileGroups.messages.fetchError", {defaultValue: "Failed to load file group details"}));
                })
                .finally(() => {
                    setLoadingSelectedFiles(false);
                });
        setIsModalOpen(true);
    }

    function handleSubmit() {
        form.validateFields()
                .then(values => {
                    const payload: FileGroupRequest = {
                        id: values.id ?? 0,
                        path: values.path?.trim() ?? "",
                        group_name: values.group_name?.trim() ?? "",
                        description: values.description?.trim() ?? "",
                        file_ids: selectedFiles.map(f => (f as any).id),
                    };

                    const op = editingGroup ? fileGroupAPI.update(payload) : fileGroupAPI.create(payload);

                    return op.then(_res => {
                        message.success(
                                editingGroup
                                        ? t("FileGroups.messages.updateSuccess", {defaultValue: "File group updated successfully"})
                                        : t("FileGroups.messages.createSuccess", {defaultValue: "File group created successfully"})
                        );
                        setIsModalOpen(false);
                        fetchGroups();
                    });
                })
                .catch((err) => {
                    if (err?.errorFields) {
                        return; // form validation error, already highlighted
                    }
                    console.error("Failed to submit file group:", err);
                    message.error(
                            editingGroup
                                    ? t("FileGroups.messages.updateError", {defaultValue: "Failed to update file group"})
                                    : t("FileGroups.messages.createError", {defaultValue: "Failed to create file group"})
                    );
                });
    }

    function handleDelete(id: number) {
        setLoading(true);
        fileGroupAPI.delete(id)
                .then((ok) => {
                    if (ok) {
                        message.success(t("FileGroups.messages.deleteSuccess", {defaultValue: "File group deleted"}));
                        fetchGroups();
                    } else {
                        message.error(t("FileGroups.messages.deleteError", {defaultValue: "Failed to delete file group"}));
                    }
                })
                .catch((err) => {
                    console.error("Failed to delete file group:", err);
                    message.error(t("FileGroups.messages.deleteError", {defaultValue: "Failed to delete file group"}));
                })
                .finally(() => setLoading(false));
    }

    function onExpand(expanded: boolean, record: FileGroupListResponse) {
        const id = (record as any).id as number;
        setExpandedKeys(prev =>
                expanded ? Array.from(new Set([...prev, id])) : prev.filter(k => k !== id)
        );

        if (expanded && (!groupFiles[id] || groupFiles[id].files.length === 0)) {
            setGroupFiles(prev => ({...prev, [id]: {loading: true, files: []}}));
            fileGroupAPI.findById(id)
                    .then((full: FileGroupResponse) => {
                        setGroupFiles(prev => ({...prev, [id]: {loading: false, files: full.files ?? []}}));
                    })
                    .catch((err) => {
                        console.error("Failed to fetch group details:", err);
                        message.error(t("FileGroups.messages.fetchError", {defaultValue: "Failed to load file group details"}));
                        setGroupFiles(prev => ({...prev, [id]: {loading: false, files: []}}));
                    });
        }
    }

    const columns: ColumnsType<FileGroupListResponse> = useMemo(() => [
        {
            title: t("FileGroups.columns.path.title", {defaultValue: "Path"}),
            dataIndex: "path",
            key: "path",
            sorter: true,
            sortOrder: sortField === "path" ? sortOrder : undefined,
        },
        {
            title: t("FileGroups.columns.group_name.title", {defaultValue: "Group name"}),
            dataIndex: "group_name",
            key: "group_name",
            sorter: true,
            sortOrder: sortField === "group_name" ? sortOrder : undefined,
        },
        {
            title: t("FileGroups.columns.description.title", {defaultValue: "Description"}),
            dataIndex: "description",
            key: "description",
            sorter: true,
            sortOrder: sortField === "description" ? sortOrder : undefined,
        },
        {
            title: t("FileGroups.columns.file_count.title", {defaultValue: "Files"}),
            dataIndex: "file_count",
            key: "file_count",
            sorter: true,
            sortOrder: sortField === "file_count" ? sortOrder : undefined,
            render: (_: any, record) => (record as any).file_count ?? (record as any).files?.length ?? "",
        },
        {
            title: t("FileGroups.columns.actions.title", {defaultValue: "Actions"}),
            key: "actions",
            width: 210,
            render: (_: any, record: FileGroupListResponse) => {
                const id = (record as any).id as number;
                return (
                        <Space>
                            <Button icon={<EditOutlined/>} onClick={() => openEditModal(record)}/>
                            <Button
                                    type="primary"
                                    icon={<UploadOutlined/>}
                                    style={{background: "#389e0d", borderColor: "#389e0d"}}
                                    onClick={() => openPublishModal(record)}
                            >
                                {t("FileGroups.actions.publish", {defaultValue: "Publish"})}
                            </Button>
                            <Popconfirm
                                    title={t("FileGroups.popconfirm.delete.title", {defaultValue: "Delete file group"})}
                                    description={t("FileGroups.popconfirm.delete.description", {defaultValue: "Are you sure you want to delete this file group?"})}
                                    okText={t("Common.popconfirm.yes", {defaultValue: "Yes"})}
                                    cancelText={t("Common.popconfirm.no", {defaultValue: "No"})}
                                    onConfirm={() => handleDelete(id)}
                            >
                                <Button danger icon={<DeleteOutlined/>}/>
                            </Popconfirm>
                        </Space>
                );
            }
        }
    ], [sortField, sortOrder, t]);

    const fileColumns: ColumnsType<FileResponse> = useMemo(() => [
        filenameColumn<FileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }, t),
        filePathColumn<FileResponse>(t),
        fileSizeColumn<FileResponse>(t),
        mimetypeColumn<FileResponse>(t),
        createdColumn<FileResponse>(t),
    ], [t]);

    const toBackendSortField = (field?: string): string => {
        switch (field) {
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

    const openPublishModal = (record: FileGroupListResponse) => {
        setPublishingGroup(record);
        publishForm.setFieldsValue({
            gallery_name: (record as any).group_name ?? "",
            gallery_description: (record as any).description ?? ""
        });
        setPublishModalOpen(true);
    };

    const closePublishModal = () => {
        setPublishModalOpen(false);
        setPublishingGroup(null);
        publishForm.resetFields();
    };

    const submitPublish = () => {
        publishForm.validateFields()
                .then(values => {
                    if (!publishingGroup) return;
                    setPublishSubmitting(true);
                    const request: PublishFileGroupRequest = {
                        file_group_id: (publishingGroup as any).id,
                        gallery_name: values.gallery_name || null,
                        gallery_description: values.gallery_description || null
                    };
                    publishAPI.publishFileGroup(request)
                            .then((result: PublishFileGroupResponse[]) => {
                                const count = result?.[0]?.files_to_publish_count ?? 0;
                                message.success(t("PublishFileGroup.messages.publishSuccess", {count}));
                                closePublishModal();
                            })
                            .catch(err => {
                                console.error("Failed to publish file group:", err);
                                message.error(t("PublishFileGroup.messages.publishError", {defaultValue: "Failed to publish file group"}));
                            })
                            .finally(() => {
                                setPublishSubmitting(false);
                                fetchGroups();
                            });
                })
                .catch(() => undefined);
    };

    const handleCandidateTypeChange = (val: FileTypeEnum) => {
        const nextType = val as FileTypeEnum;
        setCandidateType(nextType);
        fetchCandidatesByType(nextType);
    };

    return (
            <Space vertical={true} style={{width: "95%", margin: 30}} size="large">
                <Space style={{width: "100%", justifyContent: "space-between"}}>
                    <Space align="center" size={16}>
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
                    <Button type="primary" icon={<PlusOutlined/>} onClick={openCreateModal}>
                        {t("FileGroups.actions.new", {defaultValue: "New group"})}
                    </Button>
                </Space>

                <Spin spinning={loading}>
                    <Table<FileGroupListResponse>
                            columns={columns}
                            dataSource={groups.map(g => ({...g, key: (g as any).id}))}
                            loading={loading}
                            pagination={{
                                current: currentPage,
                                pageSize: pageSize,
                                total: totalElements,
                                showSizeChanger: true,
                                pageSizeOptions: ['10', '20', '50', '100'],
                            }}
                            onChange={handleTableChange}
                            expandable={{
                                expandedRowKeys: expandedKeys,
                                onExpand,
                                expandedRowRender: (record: FileGroupListResponse) => {
                                    const id = (record as any).id as number;
                                    const state = groupFiles[id] ?? {loading: false, files: []};
                                    return (
                                            <Spin spinning={state.loading}>
                                                <Table<FileResponse>
                                                        columns={fileColumns}
                                                        dataSource={(state.files ?? []).map(f => ({...f, key: (f as any).id ?? f.external_file_id}))}
                                                        pagination={false}
                                                        size="small"
                                                        rowKey={(f) => (f as any).external_file_id}
                                                />
                                            </Spin>
                                    );
                                }
                            }}
                            rowKey={(r) => (r as any).id}  // FIX: return numeric id to match expandedRowKeys
                    />
                </Spin>

                <Modal
                        open={isModalOpen}
                        title={
                            editingGroup
                                    ? t("FileGroups.modal.edit.title", {defaultValue: "Edit file group"})
                                    : t("FileGroups.modal.create.title", {defaultValue: "Create file group"})
                        }
                        okText={editingGroup ? t("Common.modal.save", {defaultValue: "Save"}) : t("Common.modal.create", {defaultValue: "Create"})}
                        cancelText={t("Common.modal.cancel", {defaultValue: "Cancel"})}
                        onOk={handleSubmit}
                        onCancel={() => setIsModalOpen(false)}
                        destroyOnHidden
                        maskClosable
                        width={900}
                >
                    <Form form={form} layout="vertical">
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
                                    onChange={handleCandidateTypeChange}
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

                        <Spin spinning={loadingSelectedFiles}>
                            <Table<FileResponse>
                                    size="small"
                                    pagination={{
                                        pageSize: 10,
                                        showSizeChanger: true,
                                        pageSizeOptions: ['10', '20', '50'],
                                    }}
                                    dataSource={selectedFiles.map(f => ({...f, key: (f as any).id}))}
                                    columns={[
                                        filenameColumn<FileResponse>((record) => {
                                            setSelectedFile(record);
                                            setDetailsOpen(true);
                                        }, t),
                                        filePathColumn<FileResponse>(t),
                                        fileSizeColumn<FileResponse>(t),
                                        mimetypeColumn<FileResponse>(t),
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
                        </Spin>
                    </Space>
                </Modal>

                <Modal
                        open={publishModalOpen}
                        title={t("PublishFileGroup.modal.title", {defaultValue: "Publish file group"})}
                        onOk={submitPublish}
                        onCancel={closePublishModal}
                        confirmLoading={publishSubmitting}
                        destroyOnClose
                >
                    <Form form={publishForm} layout="vertical">
                        <Form.Item
                                name="gallery_name"
                                label={t("PublishFileGroup.modal.galleryName.label", {defaultValue: "Gallery name"})}
                        >
                            <Input placeholder={t("PublishFileGroup.modal.galleryName.placeholder", {defaultValue: "Enter gallery name"})}/>
                        </Form.Item>
                        <Form.Item
                                name="gallery_description"
                                label={t("PublishFileGroup.modal.galleryDescription.label", {defaultValue: "Gallery description"})}
                        >
                            <Input.TextArea rows={4}
                                            placeholder={t("PublishFileGroup.modal.galleryDescription.placeholder", {defaultValue: "Describe the gallery"})}/>
                        </Form.Item>
                    </Form>
                </Modal>

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
