import {Space} from "antd";
import {useNavigate, useParams} from "react-router-dom";
import {UnitEditor, useSession, validateParamId} from "@vempain/vempain-auth-frontend";
import {unitAPI, userAPI} from "../../services";

/** Route host of the shared unit editor for the file backend's user base: /management/units/:paramId/edit (0 creates) */
export function UnitEdit() {
    const {paramId} = useParams();
    const navigate = useNavigate();
    const {userSession} = useSession();
    const unitId = Math.max(0, validateParamId(paramId));

    return (
            <Space vertical={true} style={{width: "95%", margin: 30}} size="large">
                <UnitEditor unitAPI={unitAPI}
                            userAPI={userAPI}
                            unitId={unitId}
                            currentUserId={userSession?.id ? Number(userSession.id) : undefined}
                            onSaved={() => navigate("/management/units")}
                            onCancel={() => navigate("/management/units")}/>
            </Space>
    );
}
