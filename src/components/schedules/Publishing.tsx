import {Alert, Button, Space} from "antd";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";

export function Publishing() {
    const navigate = useNavigate();
    const {t} = useTranslation();

    return (
            <Space vertical={true} style={{width: "100%", margin: 30}} align="center" size="large">
                <Alert
                        type="info"
                        title={t("Publishing.alert.message")}
                        description={t("Publishing.alert.description")}
                        showIcon
                        action={
                            <Button type="primary" onClick={() => navigate("/")}>
                                {t("Publishing.alert.returnButton")}
                            </Button>
                        }
                />
            </Space>
    );
}
