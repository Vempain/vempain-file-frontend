import {Alert, Button, Space} from "antd";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";

export function FilePermissions() {
    const navigate = useNavigate();
    const {t} = useTranslation();

    return (
            <Space direction="vertical" style={{width: "100%", margin: 30}} align="center" size="large">
                <Alert
                        type="info"
                        message={t("FilePermissions.alert.message")}
                        description={t("FilePermissions.alert.description")}
                        showIcon
                        action={
                            <Button type="primary" onClick={() => navigate("/")}>
                                {t("FilePermissions.alert.returnButton")}
                            </Button>
                        }
                />
            </Space>
    );
}
