import {Alert, Button, Space} from "antd";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";

export function Account() {
    const navigate = useNavigate();
    const {t} = useTranslation();

    return (
            <Space direction="vertical" style={{width: "100%", margin: 30}} align="center" size="large">
                <Alert
                        type="info"
                        message={t("Account.alert.message")}
                        description={t("Account.alert.description")}
                        showIcon
                        action={
                            <Button type="primary" onClick={() => navigate("/")}>
                                {t("Account.alert.returnButton")}
                            </Button>
                        }
                />
            </Space>
    );
}
