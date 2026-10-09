import {Space} from "antd";
import {useNavigate} from "react-router-dom";
import {UserList} from "@vempain/vempain-auth-frontend";
import {userAPI} from "../../services";

/** Users of the file backend's own user base; editing happens on /management/users/:id/edit */
export function Users() {
    const navigate = useNavigate();
    return (
            <Space vertical={true} style={{width: "95%", margin: 30}} size="large">
                <UserList userAPI={userAPI}
                          onEdit={id => navigate(`/management/users/${id}/edit`)}
                          onCreate={() => navigate("/management/users/0/edit")}/>
            </Space>
    );
}
