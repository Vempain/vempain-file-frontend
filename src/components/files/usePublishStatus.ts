import {useEffect, useState} from "react";
import type {FormInstance} from "antd";
import type {PublishedAclResponse} from "../../models";
import {PUBLISH_ACL_FIELD} from "../../tools/publishAcl";

/** The part of the publish status answers the hook needs: whether published, and the rows of the previous publish */
export interface PublishedStatus {
    published: boolean;
    acls: PublishedAclResponse[];
}

export interface PublishStatusState<T extends PublishedStatus> {
    /** The answer of the file backend; null while loading, after a failure and while the dialog is closed */
    status: T | null;
    loading: boolean;
    failed: boolean;
}

/**
 * Loads the publication status of the file or group a publish dialog is about to publish, each time the dialog opens, and prefills the
 * dialog's ACL rows (the PUBLISH_ACL_FIELD list of the form) with the grantees of the previous publish, so that the user does not have
 * to enter them again. A failed lookup leaves the rows empty and is reported through `failed`; the dialog can still publish.
 */
export function usePublishStatus<T extends PublishedStatus>(open: boolean, load: () => Promise<T>, form: FormInstance): PublishStatusState<T> {
    const [status, setStatus] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [failed, setFailed] = useState<boolean>(false);

    useEffect(() => {
        if (!open) {
            setStatus(null);
            setLoading(false);
            setFailed(false);
            return;
        }

        let active = true;
        setLoading(true);
        setFailed(false);
        load()
            .then(answer => {
                if (!active) return;
                setStatus(answer);
                if (answer.published) {
                    form.setFieldValue(PUBLISH_ACL_FIELD, answer.acls.map(acl => ({...acl})));
                }
            })
            .catch(err => {
                if (!active) return;
                console.error("Failed to load the publication status:", err);
                setFailed(true);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
        // The loader is recreated on every render of the host; the status is reloaded when the dialog opens, not when the loader changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, form]);

    return {status, loading, failed};
}
