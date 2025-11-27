import {Alert, Button, Space} from "antd";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";

export function FileImports() {
    const navigate = useNavigate();
    const {t} = useTranslation();

    return (
            <Space vertical={true} style={{width: "100%", margin: 30}} align="center" size="large">
                <Alert
                        type="info"
                        title={t("FileImports.alert.message")}
                        description={t("FileImports.alert.description")}
                        showIcon
                        action={
                            <Button type="primary" onClick={() => navigate("/")}>
                                {t("FileImports.alert.returnButton")}
                            </Button>
                        }
                />
            </Space>
    );
}
