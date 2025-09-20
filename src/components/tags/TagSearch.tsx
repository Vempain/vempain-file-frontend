import {Alert, Button, Space} from "antd";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";

export function TagSearch() {
    const navigate = useNavigate();
    const {t} = useTranslation();

    return (
            <Space direction="vertical" style={{width: "100%", margin: 30}} align="center" size="large">
                <Alert
                        type="info"
                        message={t("TagSearch.alert.message")}
                        description={t("TagSearch.alert.description")}
                        showIcon
                        action={
                            <Button type="primary" onClick={() => navigate("/")}>
                                {t("TagSearch.alert.returnButton")}
                            </Button>
                        }
                />
            </Space>
    );
}
