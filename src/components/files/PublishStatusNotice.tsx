import {Alert, Spin} from "antd";
import {useTranslation} from "react-i18next";

interface PublishStatusNoticeProps {
    loading: boolean;
    failed: boolean;
    /** Null until the status is known */
    published: boolean | null;
    /** What the previous publish created, shown when published */
    publishedMessage: string;
}

/**
 * The line above the ACL editor of the publish dialogs: whether the file or group was published before (and what the previous publish
 * created), that the grantees of that publish are prefilled, or that the lookup failed and the rows start empty.
 */
export function PublishStatusNotice({loading, failed, published, publishedMessage}: PublishStatusNoticeProps) {
    const {t} = useTranslation();

    if (loading) {
        return <Spin size="small" data-testid="publish-status-loading"/>;
    }
    if (failed) {
        return <Alert type="warning" showIcon data-testid="publish-status-failed"
                      title={t("PublishStatus.loadError", {defaultValue: "Could not check whether this was published before; the permissions start empty"})}/>;
    }
    if (published) {
        return <Alert type="info" showIcon data-testid="publish-status-published" title={publishedMessage}
                      description={t("PublishStatus.prefilled", {
                          defaultValue: "The admin users and units granted access by the previous publish are prefilled below; publishing again keeps the same site files."
                      })}/>;
    }
    if (published === false) {
        return <Alert type="success" showIcon data-testid="publish-status-new"
                      title={t("PublishStatus.notPublished", {defaultValue: "Not published to Vempain Admin before"})}/>;
    }
    return null;
}
