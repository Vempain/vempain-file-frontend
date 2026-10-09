import {Space} from "antd";
import {useNavigate} from "react-router-dom";
import {UnitList} from "@vempain/vempain-auth-frontend";
import {unitAPI} from "../../services";

/** Units of the file backend's own user base; editing (members, nesting, ACL) happens on /management/units/:id/edit */
export function Units() {
    const navigate = useNavigate();
    return (
            <Space vertical={true} style={{width: "95%", margin: 30}} size="large">
                <UnitList unitAPI={unitAPI}
                          onEdit={id => navigate(`/management/units/${id}/edit`)}
                          onCreate={() => navigate("/management/units/0/edit")}/>
            </Space>
    );
}
