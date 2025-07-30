import {Alert, Button, Space} from "antd";
import {useNavigate} from "react-router-dom";

function DocumentFiles() {
    const navigate = useNavigate();

    return (
            <Space direction="vertical" style={{width: "100%", margin: 30}} align="center" size="large">
                <Alert
                        type="info"
                        message="Document Files"
                        description="This is the Document Files page."
                        showIcon
                        action={
                            <Button type="primary" onClick={() => navigate("/")}>
                                Return to front page
                            </Button>
                        }
                />
            </Space>
    );
}

export {DocumentFiles};