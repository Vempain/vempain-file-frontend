import {Alert, Button, Space} from "antd";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";

export function SystemSchedules() {
    const navigate = useNavigate();
    const {t} = useTranslation();

    return (
            <Space vertical={true} style={{width: "100%", margin: 30}} align="center" size="large">
                <Alert
                        type="info"
                        title={t("SystemSchedules.alert.message")}
                        description={t("SystemSchedules.alert.description")}
                        showIcon
                        action={
                            <Button type="primary" onClick={() => navigate("/")}>
                                {t("SystemSchedules.alert.returnButton")}
                            </Button>
                        }
                />
            </Space>
    );
}
