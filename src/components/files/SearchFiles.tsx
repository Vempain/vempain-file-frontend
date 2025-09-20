import {Alert, Button, Space} from "antd";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";

function SearchFiles() {
    const navigate = useNavigate();
    const {t} = useTranslation();

    return (
            <Space direction="vertical" style={{width: "100%", margin: 30}} align="center" size="large">
                <Alert
                        type="info"
                        message={t("SearchFiles.alert.message")}
                        description={t("SearchFiles.alert.description")}
                        showIcon
                        action={
                            <Button type="primary" onClick={() => navigate("/")}>
                                {t("SearchFiles.alert.returnButton")}
                            </Button>
                        }
                />
            </Space>
    );
}

export {SearchFiles};