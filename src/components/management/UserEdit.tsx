import {Space} from "antd";
import {useNavigate, useParams} from "react-router-dom";
import {UserEditor, useSession, validateParamId} from "@vempain/vempain-auth-frontend";
import {unitAPI, userAPI} from "../../services";

/** Route host of the shared user editor for the file backend's user base: /management/users/:paramId/edit (0 creates) */
export function UserEdit() {
    const {paramId} = useParams();
    const navigate = useNavigate();
    const {userSession} = useSession();
    const userId = Math.max(0, validateParamId(paramId));

    return (
            <Space vertical={true} style={{width: "95%", margin: 30}} size="large">
                <UserEditor userAPI={userAPI}
                            unitAPI={unitAPI}
                            userId={userId}
                            currentUserId={userSession?.id ? Number(userSession.id) : undefined}
                            onSaved={() => navigate("/management/users")}
                            onCancel={() => navigate("/management/users")}/>
            </Space>
    );
}
