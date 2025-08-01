import {Alert, Button, Form, Input, message, Space, Spin} from "antd";
import {useNavigate} from "react-router-dom";
import {useState} from "react";
import type {ScanResponse} from "../../models/responses";
import type {ScanRequest} from "../../models/requests";
import {fileScannerAPI} from "../../services";

export function ImportFiles() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ScanResponse | null>(null);

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
                    <Form layout="vertical" onFinish={onFinish} style={{minWidth: 350}}>
                        <Form.Item
                                label="Directory Path"
                                name="directory_name"
                                rules={[{required: true, message: "Please input the directory path!"}]}
                        >
                            <Input placeholder="e.g. /data/files"/>
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
