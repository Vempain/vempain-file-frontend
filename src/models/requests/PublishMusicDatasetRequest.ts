import type {PublishAclRequest} from "./PublishAclRequest";

/** Options of the music data set creation (`POST /data-publish/music`) */
export interface PublishMusicDatasetRequest {
    /** Also start the admin backend's publishing of the created data set to the website ("Create and publish") */
    publish_to_site: boolean;
    /**
     * Admin users and units granted privileges on the data set in the admin backend. When the data set exists already the list replaces
     * its current grantees (an empty list removes them); null leaves them untouched.
     */
    acls?: PublishAclRequest[] | null;
}
