import {Alert, AutoComplete, Button, Form, message, Space, Spin} from "antd";
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import type {ScanResponse} from "../../models/responses";
import type {PathCompletionRequest, ScanRequest} from "../../models/requests";
import {fileScannerAPI, pathCompletionAPI} from "../../services";

export function ImportFiles() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [completionsLoading, setCompletionsLoading] = useState(false);
    const [result, setResult] = useState<ScanResponse | null>(null);
    const [options, setOptions] = useState<{ value: string }[]>([]);
    const [form] = Form.useForm();

    useEffect(() => {
        // Load initial path suggestions when component mounts
        fetchPathCompletions("/");
    }, []);

    const fetchPathCompletions = async (path: string) => {
        setCompletionsLoading(true);
        try {
            const request: PathCompletionRequest = {path: path || "/"};
            const response = await pathCompletionAPI.completePath(request);
            setOptions(response.completions.map(path => ({value: path})));
        } catch (err) {
            console.error("Failed to fetch path completions:", err);
            setOptions([]);
        } finally {
            setCompletionsLoading(false);
        }
    };

    const handleSearch = (value: string) => {
        console.log("Handling search for path:", value);
        fetchPathCompletions(value);
    };

    const handleSelect = (value: string) => {
        console.log("Setting field value to:", value);
        form.setFieldValue("directory_name", value);
        fetchPathCompletions(value);
    };

    const onFinish = async (values: ScanRequest) => {
        setLoading(true);
        setResult(null);
        try {
            const response = await fileScannerAPI.create(values);
            setResult(response);
            message.success("Scan started successfully!");
        } catch (err) {
            message.error("Failed to start scan: " + (err instanceof Error ? err.message : "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

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
                                label="Directory Path"
                                name="directory_name"
                                rules={[{required: true, message: "Please input the directory path!"}]}
                        >
                            <AutoComplete
                                    options={options}
                                    onSearch={handleSearch}
                                    onSelect={handleSelect}
                                    placeholder="e.g. /data/files"
                                    notFoundContent={completionsLoading ? <Spin size="small"/> : "No suggestions"}
                            />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                Start Scan
                            </Button>
                            <Button style={{marginLeft: 8}} onClick={() => navigate("/")}>
                                Return to front page
                            </Button>
                        </Form.Item>
                    </Form>
                </Spin>
                {result && (
                        <Alert
                                type="success"
                                message="Scan Result"
                                description={
                                    <pre style={{textAlign: "left"}}>
                            {JSON.stringify(result, null, 2)}
                        </pre>
                                }
                                showIcon
                        />
                )}
            </Space>
    );
}