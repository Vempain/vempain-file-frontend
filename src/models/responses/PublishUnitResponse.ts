/** Admin-backend unit offered as an ACL grantee when publishing; proxied by the file backend from the admin backend */
export interface PublishUnitResponse {
    id: number;
    name: string;
    description: string | null;
}
