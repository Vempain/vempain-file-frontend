import {AutoComplete, Button, Form, Space, Spin, Table} from "antd";
import {type Key, useEffect, useState} from "react";
import type {ExportFileResponse, FileResponse, PathCompletionRequest, ScanRequest, ScanResponses} from "../../models";
import {PathCompletionEnum} from "../../models";
import {fileScannerAPI, pathCompletionAPI} from "../../services";
import type {ColumnsType} from "antd/es/table";
import dayjs from "dayjs";
import {compareDayjsNullable, formatDayjsNullable} from "../../tools";
import {useTranslation} from "react-i18next";

export function ImportFiles() {
    const {t} = useTranslation();
    const [loading, setLoading] = useState(false);
    const [completionsLoading, setCompletionsLoading] = useState(false);
    const [result, setResult] = useState<ScanResponses | null>(null);
    const [originalPathOptions, setOriginalPathOptions] = useState<{ value: string }[]>([]);
    const [exportedPathOptions, setExportedPathOptions] = useState<{ value: string }[]>([]);
    const [form] = Form.useForm();

    // File response columns for the table
    const fileColumns: ColumnsType<FileResponse> = [
        {
            title: t("ImportFiles.fileColumns.filename.title"),
            dataIndex: 'filename',
            key: 'filename',
            sorter: (a: FileResponse, b: FileResponse) => a.filename.localeCompare(b.filename),
        },
        {
            title: t("ImportFiles.fileColumns.external_file_id.title"),
            dataIndex: 'external_file_id',
            key: 'external_file_id',
        },
        {
            title: t("ImportFiles.fileColumns.mimetype.title"),
            dataIndex: 'mimetype',
            key: 'mimetype',
            sorter: (a: FileResponse, b: FileResponse) => a.mimetype.localeCompare(b.mimetype),
        },
        {
            title: t("ImportFiles.fileColumns.filesize.title"),
            dataIndex: 'filesize',
            key: 'filesize',
            sorter: (a: FileResponse, b: FileResponse) => a.filesize - b.filesize,
            render: (size: number) => `${(size / 1024).toFixed(2)} KB`,
        },
        {
            title: t("ImportFiles.fileColumns.sha256sum.title"),
            dataIndex: 'sha256sum',
            key: 'sha256sum',
        },
        {
            title: t("ImportFiles.fileColumns.original_datetime.title"),
            dataIndex: 'original_datetime',
            key: 'original_datetime',
            sorter: (a: FileResponse, b: FileResponse) =>
                    compareDayjsNullable(
                            a.original_datetime ? dayjs(a.original_datetime as unknown as string) : null,
                            b.original_datetime ? dayjs(b.original_datetime as unknown as string) : null
                    ),
            render: (date: string) => formatDayjsNullable(date ? dayjs(date) : null),
        },
        {
            title: t("ImportFiles.fileColumns.description.title"),
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: t("ImportFiles.fileColumns.file_type.title"),
            dataIndex: 'file_type',
            key: 'file_type',
            sorter: (a: FileResponse, b: FileResponse) => a.file_type.localeCompare(b.file_type),
        },
        {
            title: t("ImportFiles.fileColumns.rights_holder.title"),
            dataIndex: 'rights_holder',
            key: 'rights_holder',
            sorter: (a: FileResponse, b: FileResponse) => a.rights_holder.localeCompare(b.rights_holder),
        },

        {
            title: t("ImportFiles.fileColumns.rights_terms.title"),
            dataIndex: 'rights_terms',
            key: 'rights_terms',
            sorter: (a: FileResponse, b: FileResponse) => a.rights_terms.localeCompare(b.rights_terms),
        },
        {
            title: t("ImportFiles.fileColumns.rights_url.title"),
            dataIndex: 'rights_url',
            key: 'rights_url',
            sorter: (a: FileResponse, b: FileResponse) => a.rights_url.localeCompare(b.rights_url),
        },
        {
            title: t("ImportFiles.fileColumns.creator_name.title"),
            dataIndex: 'creator_name',
            key: 'creator_name',
            sorter: (a: FileResponse, b: FileResponse) => a.creator_name.localeCompare(b.creator_name),
        },
        {
            title: t("ImportFiles.fileColumns.creator_country.title"),
            dataIndex: 'creator_country',
            key: 'creator_country',
            sorter: (a: FileResponse, b: FileResponse) => a.creator_country.localeCompare(b.creator_country),
        },
        {
            title: t("ImportFiles.fileColumns.creator_email.title"),
            dataIndex: 'creator_email',
            key: 'creator_email',
            sorter: (a: FileResponse, b: FileResponse) => a.creator_email.localeCompare(b.creator_email),
        },
        {
            title: t("ImportFiles.fileColumns.creator_url.title"),
            dataIndex: 'creator_url',
            key: 'creator_url',
            sorter: (a: FileResponse, b: FileResponse) => a.creator_url.localeCompare(b.creator_url),
        },
        {
            title: t("ImportFiles.fileColumns.tags.title"),
            dataIndex: 'tags',
            key: 'tags',
            render: (tags: string[]) => tags?.join(', ') || '',
        },
        {
            title: t("ImportFiles.fileColumns.created.title"),
            dataIndex: 'created',
            key: 'created',
            sorter: (a: FileResponse, b: FileResponse) =>
                    a.created.isAfter(b.created) ? 1 :
                            a.created.isBefore(b.created) ? -1 : 0,
            render: (date: string) => new Date(date).toLocaleString(),
        },
        {
            title: t("ImportFiles.fileColumns.modified.title"),
            dataIndex: 'modified',
            key: 'modified',
            sorter: (a: FileResponse, b: FileResponse) => {
                if (a.modified == null && b.modified == null) {
                    return 0;
                }
                if (a.modified == null) {
                    return -1;
                }
                if (b.modified == null) {
                    return 1;
                }
                return a.modified.isAfter(b.modified) ? 1 :
                        a.modified.isBefore(b.modified) ? -1 :
                                0;
            },
            render: (date: string) => new Date(date).toLocaleString(),
        },
        {
            title: t("ImportFiles.fileColumns.locked.title"),
            dataIndex: 'locked',
            key: 'locked',
            render: (locked: boolean) => locked ? t("Common.general.yes") : t("Common.general.no"),
            filters: [
                {text: t("ImportFiles.fileColumns.locked.filters.yes"), value: true},
                {text: t("ImportFiles.fileColumns.locked.filters.no"), value: false},
            ],
            onFilter: (value: boolean | Key, record: FileResponse) => record.locked === value,
        },
    ];

    // Exported file response columns for the export files table
    const exportFileColumns: ColumnsType<ExportFileResponse> = [
        {title: t("ImportFiles.exportFileColumns.id.title"), dataIndex: 'id', key: 'id'},
        {title: t("ImportFiles.exportFileColumns.file_id.title"), dataIndex: 'file_id', key: 'file_id'},
        {
            title: t("ImportFiles.exportFileColumns.filename.title"),
            dataIndex: 'filename',
            key: 'filename',
            sorter: (a: ExportFileResponse, b: ExportFileResponse) => a.filename.localeCompare(b.filename),
        },
        {title: t("ImportFiles.exportFileColumns.file_path.title"), dataIndex: 'file_path', key: 'file_path'},
        {
            title: t("ImportFiles.exportFileColumns.mimetype.title"),
            dataIndex: 'mimetype',
            key: 'mimetype',
            sorter: (a: ExportFileResponse, b: ExportFileResponse) => a.mimetype.localeCompare(b.mimetype),
        },
        {
            title: t("ImportFiles.exportFileColumns.filesize.title"),
            dataIndex: 'filesize',
            key: 'filesize',
            sorter: (a: ExportFileResponse, b: ExportFileResponse) => a.filesize - b.filesize,
            render: (size: number) => `${(size / 1024).toFixed(2)} KB`,
        },
        {title: t("ImportFiles.exportFileColumns.sha256sum.title"), dataIndex: 'sha256sum', key: 'sha256sum'},
        {
            title: t("ImportFiles.exportFileColumns.original_document_id.title"),
            dataIndex: 'original_document_id',
            key: 'original_document_id',
        },
        {
            title: t("ImportFiles.exportFileColumns.created.title"),
            dataIndex: 'created',
            key: 'created',
            sorter: (a: ExportFileResponse, b: ExportFileResponse) =>
                    new Date(a.created).getTime() - new Date(b.created).getTime(),
            render: (date: string) => new Date(date).toLocaleString(),
        },
    ];

    useEffect(() => {
        // Load initial path suggestions when component mounts
        setLoading(true);
        Promise.all([
            fetchPathCompletions(PathCompletionEnum.ORIGINAL, "/"),
            fetchPathCompletions(PathCompletionEnum.EXPORTED, "/"),
        ])
                .then(() => {
                    console.log("Initial path completions loaded");
                })
                .catch((err) => {
                    console.error("Failed to load initial path completions:", err);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);

    async function fetchPathCompletions(directoryType: PathCompletionEnum, path: string) {
        setCompletionsLoading(true);

        const request: PathCompletionRequest = {
            path: path || "/",
            type: directoryType
        };
        pathCompletionAPI.completePath(request)
                .then((response) => {

                    switch (directoryType) {
                        case PathCompletionEnum.ORIGINAL:
                            setOriginalPathOptions(response.completions.map(path => ({value: path})));
                            break;
                        case PathCompletionEnum.EXPORTED:
                            setExportedPathOptions(response.completions.map(path => ({value: path})));
                            break;
                        default:
                            console.error("Unknown directory type:", directoryType);
                            setOriginalPathOptions([]);
                            setExportedPathOptions([]);
                    }
                })
                .catch((err) => {
                    console.error("Failed to fetch path completions:", err);
                    setExportedPathOptions([]);
                })
                .finally(() => {
                    setCompletionsLoading(false);
                });
    }

    function handleSearch(directoryType: PathCompletionEnum, value: string) {
        console.log("Handling search for type " + directoryType + " path:", value);
        fetchPathCompletions(directoryType, value);
    }

    function handleSelect(directoryType: PathCompletionEnum, value: string) {
        console.log("Setting field value to:", value);
        form.setFieldValue("directory_name", value);
        fetchPathCompletions(directoryType, value);
    }

    function handleSearchOriginal(value: string) {
        handleSearch(PathCompletionEnum.ORIGINAL, value);
    }

    function handleSearchExported(value: string) {
        handleSearch(PathCompletionEnum.EXPORTED, value);
    }

    function handleSelectOriginal(value: string) {
        handleSelect(PathCompletionEnum.ORIGINAL, value);
    }

    function handleSelectExported(value: string) {
        handleSelect(PathCompletionEnum.EXPORTED, value);
    }

    function onFinish(values: ScanRequest) {
        setLoading(true);
        setResult(null);

        fileScannerAPI.scanDirectory(values)
                .then((response: ScanResponses) => {
                    setResult(response);
                })
                .catch((err: Error) => {
                    console.error("Failed to start scan: " + err.message);
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    return (
            <Space vertical={true} style={{width: "95%", margin: 30}} align="center" size="large">
                <Spin spinning={loading}>
                    <Form
                            layout="vertical"
                            onFinish={onFinish}
                            style={{minWidth: 350}}
                            form={form}
                            initialValues={{directory_name: "/"}}
                    >
                        <Form.Item
                                label={t("ImportFiles.form.originalPath.label")}
                                name="original_directory"
                                rules={[
                                    {
                                        validator: async (_, value) => {
                                            const exportDir = form.getFieldValue("export_directory");
                                            if (!value && !exportDir) {
                                                return Promise.reject(new Error(t("ImportFiles.form.validation.atLeastOnePath")));
                                            }
                                            return Promise.resolve();
                                        }
                                    }
                                ]}
                        >
                            <AutoComplete
                                    options={originalPathOptions}
                                    onSearch={handleSearchOriginal}
                                    onSelect={handleSelectOriginal}
                                    placeholder={t("ImportFiles.form.placeholder.pathExample")}
                                    notFoundContent={completionsLoading ? <Spin size="small"/> : t("ImportFiles.form.noSuggestions")}
                            />
                        </Form.Item>

                        <Form.Item
                                label={t("ImportFiles.form.exportPath.label")}
                                name="export_directory"
                                rules={[
                                    {
                                        validator: async (_, value) => {
                                            const origDir = form.getFieldValue("original_directory");
                                            if (!value && !origDir) {
                                                return Promise.reject(new Error(t("ImportFiles.form.validation.atLeastOnePath")));
                                            }
                                            return Promise.resolve();
                                        }
                                    }
                                ]}
                        >
                            <AutoComplete
                                    options={exportedPathOptions}
                                    onSearch={handleSearchExported}
                                    onSelect={handleSelectExported}
                                    placeholder={t("ImportFiles.form.placeholder.pathExample")}
                                    notFoundContent={completionsLoading ? <Spin size="small"/> : t("ImportFiles.form.noSuggestions")}
                            />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                {t("ImportFiles.form.submit.startScan")}
                            </Button>
                        </Form.Item>
                    </Form>
                </Spin>
                {result != null && (
                        <div style={{width: "100%"}}>
                            <h2 key={"original-header"}>{t("ImportFiles.results.original.title")}</h2>
                            {result.scan_original_response && result.scan_original_response.failed_files?.length > 0 && (
                                    <>
                                        <h3 key={"original-header-fail"}>{t("ImportFiles.results.failed.title")}</h3>
                                        <Table
                                                columns={[
                                                    {title: t("ImportFiles.failedTable.filename.title"), dataIndex: 'file', key: 'file'}
                                                ]}
                                                dataSource={result.scan_original_response.failed_files}
                                                scroll={{x: 'max-content'}}
                                                pagination={{
                                                    pageSize: 10,
                                                    showSizeChanger: true,
                                                    pageSizeOptions: ['10', '20', '50'],
                                                }}
                                                key={"original-failed-files-table"}
                                        />
                                    </>
                            )}

                            {result.scan_original_response && result.scan_original_response.successful_files?.length > 0 && (
                                    <>
                                        <h3 key={"original-header-success"}>{t("ImportFiles.results.success.title")}</h3>
                                        <Table
                                                dataSource={result.scan_original_response.successful_files}
                                                columns={fileColumns}
                                                pagination={{
                                                    pageSize: 10,
                                                    showSizeChanger: true,
                                                    pageSizeOptions: ['10', '20', '50'],
                                                }}
                                                key={"original-successful-files-table"}
                                        />
                                    </>
                            )}
                            <h2 key={"export-header"}>{t("ImportFiles.results.export.title")}</h2>
                            {result.scan_export_response && result.scan_export_response.failed_files?.length > 0 && (
                                    <>
                                        <h3 key={"export-header-fail"}>{t("ImportFiles.results.failed.title")}</h3>
                                        <Table
                                                columns={[
                                                    {title: t("ImportFiles.failedTable.filename.title"), dataIndex: 'file', key: 'file'}
                                                ]}
                                                dataSource={result.scan_export_response.failed_files}
                                                scroll={{x: 'max-content'}}
                                                pagination={{
                                                    pageSize: 10,
                                                    showSizeChanger: true,
                                                    pageSizeOptions: ['10', '20', '50'],
                                                }}
                                                key={"export-failed-files-table"}
                                        />
                                    </>
                            )}

                            {result.scan_export_response && result.scan_export_response.successful_files?.length > 0 && (
                                    <>
                                        <h3 key={"export-header-success"}>{t("ImportFiles.results.success.title")}</h3>
                                        <Table
                                                dataSource={result.scan_export_response.successful_files}
                                                columns={exportFileColumns}
                                                pagination={{
                                                    pageSize: 10,
                                                    showSizeChanger: true,
                                                    pageSizeOptions: ['10', '20', '50'],
                                                }}
                                                key={"export-successful-files-table"}
                                        />
                                    </>
                            )}
                        </div>
                )}
            </Space>
    );
}