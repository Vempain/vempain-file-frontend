/** Admin-backend user offered as an ACL grantee when publishing; proxied by the file backend from the admin backend */
export interface PublishUserResponse {
    id: number;
    login_name: string;
    name: string;
    nick: string;
}
