import type {PublishAclRequest} from "./PublishAclRequest";

export interface PublishAllFileGroupsRequest {
    acls?: PublishAclRequest[] | null;
}
