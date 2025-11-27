import {Alert, Button, Space} from "antd";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";

export function ChangePassword() {
    const navigate = useNavigate();
    const {t} = useTranslation();

    return (
            <Space vertical={true} style={{width: "100%", margin: 30}} align="center" size="large">
                <Alert
                        type="info"
                        title={t("ChangePassword.alert.message")}
                        description={t("ChangePassword.alert.description")}
                        showIcon
                        action={
                            <Button type="primary" onClick={() => navigate("/")}>
                                {t("ChangePassword.alert.returnButton")}
                            </Button>
                        }
                />
            </Space>
    );
}
