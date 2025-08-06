import {AutoComplete, Button, Form, Space, Spin, Table} from "antd";
import {type Key, useEffect, useState} from "react";
import type {FileResponse, ScanResponses} from "../../models/responses";
import type {PathCompletionRequest, ScanRequest} from "../../models/requests";
import {fileScannerAPI, pathCompletionAPI} from "../../services";
import type {ColumnsType} from "antd/es/table";
import {PathCompletionEnum} from "../../models";

export function ImportFiles() {
    const [loading, setLoading] = useState(false);
    const [completionsLoading, setCompletionsLoading] = useState(false);
    const [result, setResult] = useState<ScanResponses | null>(null);
    const [originalPathOptions, setOriginalPathOptions] = useState<{ value: string }[]>([]);
    const [exportedPathOptions, setExportedPathOptions] = useState<{ value: string }[]>([]);
    const [form] = Form.useForm();

    // File response columns for the table
    const fileColumns: ColumnsType<FileResponse> = [
        {
            title: 'Filename',
            dataIndex: 'filename',
            key: 'filename',
            sorter: (a: FileResponse, b: FileResponse) => a.filename.localeCompare(b.filename),
        },
        {
            title: 'External File ID',
            dataIndex: 'external_file_id',
            key: 'external_file_id',
        },
        {
            title: 'MIME Type',
            dataIndex: 'mimetype',
            key: 'mimetype',
            sorter: (a: FileResponse, b: FileResponse) => a.mimetype.localeCompare(b.mimetype),
        },
        {
            title: 'File Size',
            dataIndex: 'filesize',
            key: 'filesize',
            sorter: (a: FileResponse, b: FileResponse) => a.filesize - b.filesize,
            render: (size: number) => `${(size / 1024).toFixed(2)} KB`,
        },
        {
            title: 'SHA256 Sum',
            dataIndex: 'sha256sum',
            key: 'sha256sum',
        },
        {
            title: 'Original Date',
            dataIndex: 'original_datetime',
            key: 'original_datetime',
            sorter: (a: FileResponse, b: FileResponse) =>
                    new Date(a.original_datetime).getTime() - new Date(b.original_datetime).getTime(),
            render: (date: string) => new Date(date).toLocaleString(),
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'File Type',
            dataIndex: 'file_type',
            key: 'file_type',
            sorter: (a: FileResponse, b: FileResponse) => a.file_type.localeCompare(b.file_type),
        },
        {
            title: 'Tags',
            dataIndex: 'tags',
            key: 'tags',
            render: (tags: string[]) => tags?.join(', ') || '',
        },
        {
            title: 'Created',
            dataIndex: 'created',
            key: 'created',
            sorter: (a: FileResponse, b: FileResponse) =>
                    new Date(a.created).getTime() - new Date(b.created).getTime(),
            render: (date: string) => new Date(date).toLocaleString(),
        },
        {
            title: 'Modified',
            dataIndex: 'modified',
            key: 'modified',
            sorter: (a: FileResponse, b: FileResponse) =>
                    new Date(a.modified).getTime() - new Date(b.modified).getTime(),
            render: (date: string) => new Date(date).toLocaleString(),
        },
        {
            title: 'Locked',
            dataIndex: 'locked',
            key: 'locked',
            render: (locked: boolean) => locked ? 'Yes' : 'No',
            filters: [
                {text: 'Yes', value: true},
                {text: 'No', value: false},
            ],
            onFilter: (value: boolean | Key, record: FileResponse) => record.locked === value,
        },
    ];

    useEffect(() => {
        // Load initial path suggestions when component mounts
        setLoading(true);

        Promise.all([
            fetchPathCompletions(PathCompletionEnum.ORIGINAL, "/"),
            fetchPathCompletions(PathCompletionEnum.EXPORTED, "/")])
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
            <Space direction="vertical" style={{width: "100%", margin: 30}} align="center" size="large">
                <Spin spinning={loading}>
                    <Form
                            layout="vertical"
                            onFinish={onFinish}
                            style={{minWidth: 350}}
                            form={form}
                            initialValues={{directory_name: "/"}}
                    >
                        <Form.Item
                                label="Original Path"
                                name="original_directory"
                                rules={[
                                    {
                                        validator: async (_, value) => {
                                            const exportDir = form.getFieldValue("export_directory");
                                            if (!value && !exportDir) {
                                                return Promise.reject(
                                                        new Error("At least one of Original Path or Export Path must be filled!")
                                                );
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
                                    placeholder="e.g. /data/files"
                                    notFoundContent={completionsLoading ? <Spin size="small"/> : "No suggestions"}
                            />
                        </Form.Item>

                        <Form.Item
                                label="Export Path"
                                name="export_directory"
                                rules={[
                                    {
                                        validator: async (_, value) => {
                                            const origDir = form.getFieldValue("original_directory");
                                            if (!value && !origDir) {
                                                return Promise.reject(
                                                        new Error("At least one of Original Path or Export Path must be filled!")
                                                );
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
                                    placeholder="e.g. /data/files"
                                    notFoundContent={completionsLoading ? <Spin size="small"/> : "No suggestions"}
                            />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                Start Scan
                            </Button>
                        </Form.Item>
                    </Form>
                </Spin>
                {result != null && (
                        <div style={{width: "100%"}}>
                            <h2>Scan Result for original files</h2>
                            {result.scan_original_response && result.scan_original_response.failed_files?.length > 0 && (
                                    <>
                                        <h3>Failed to scan the following files</h3>
                                        <Table
                                                columns={[
                                                    {
                                                        title: 'Filename',
                                                        dataIndex: 'file',
                                                        key: 'file',
                                                    }
                                                ]}
                                                dataSource={result.scan_original_response.failed_files}
                                                scroll={{x: 'max-content'}}
                                                pagination={{
                                                    pageSize: 10,
                                                    showSizeChanger: true,
                                                    pageSizeOptions: ['10', '20', '50'],
                                                }}
                                        />
                                    </>
                            )}

                            {result.scan_original_response && result.scan_original_response.successful_files?.length > 0 && (
                                    <>
                                        <h3>Successful Files</h3>
                                        <Table
                                                dataSource={result.scan_original_response.successful_files}
                                                columns={fileColumns}
                                                pagination={{
                                                    pageSize: 10,
                                                    showSizeChanger: true,
                                                    pageSizeOptions: ['10', '20', '50'],
                                                }}
                                        />
                                    </>
                            )}
                            <h2>Scan Result for original files</h2>
                            {result.scan_export_response && result.scan_export_response.failed_files?.length > 0 && (
                                    <>
                                        <h3>Failed to scan the following files</h3>
                                        <Table
                                                columns={[
                                                    {
                                                        title: 'Filename',
                                                        dataIndex: 'file',
                                                        key: 'file',
                                                    }
                                                ]}
                                                dataSource={result.scan_export_response.failed_files}
                                                scroll={{x: 'max-content'}}
                                                pagination={{
                                                    pageSize: 10,
                                                    showSizeChanger: true,
                                                    pageSizeOptions: ['10', '20', '50'],
                                                }}
                                        />
                                    </>
                            )}

                            {result.scan_export_response && result.scan_export_response.successful_files?.length > 0 && (
                                    <>
                                        <h3>Successful Files</h3>
                                        <Table
                                                dataSource={result.scan_export_response.successful_files}
                                                columns={fileColumns}
                                                pagination={{
                                                    pageSize: 10,
                                                    showSizeChanger: true,
                                                    pageSizeOptions: ['10', '20', '50'],
                                                }}
                                        />
                                    </>
                            )}
                        </div>
                )}
            </Space>
    );
}