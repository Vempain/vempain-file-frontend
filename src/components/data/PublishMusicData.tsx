import {message, Space, Typography} from "antd";
import {useCallback, useMemo, useState} from "react";
import {dataAPI} from "../../services";
import type {PublishAclRequest} from "../../models";
import {useTranslation} from "react-i18next";
import {SplitActionButton, useTaskProgress} from "@vempain/vempain-common-frontend";
import {CREATE_ACTION, CREATE_AND_PUBLISH_ACTION, createActions} from "../common/createActions";
import {PublishDataSetModal} from "./PublishDataSetModal";

const {Title} = Typography;

/** Identifier of the music data set in the admin backend (DataService.MUSIC_IDENTIFIER of the file backend) */
export const MUSIC_DATA_SET_IDENTIFIER = "music_library";

export function PublishMusicData() {
    const {t} = useTranslation();
    const {trackTask} = useTaskProgress();
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    // Create the data set in the admin backend, or create it and start its publishing to the website as well
    const [action, setAction] = useState<string>(CREATE_ACTION);
    const actions = useMemo(() => createActions(t, "PublishMusicData", "Create music data set", "Create and publish music data set"), [t]);
    const actionLabel = actions.find(item => item.key === action)?.label ?? "";

    // The dialog asks which admin users and units get access to the data set, then the task is started with the rows
    const handleCreate = useCallback((acls: PublishAclRequest[]) => {
        setSubmitting(true);
        // The data set is generated and uploaded as a background task shown in the task tray
        dataAPI.publishMusic(action === CREATE_AND_PUBLISH_ACTION, acls)
                .then(accepted => {
                    trackTask(accepted);
                    message.success(t("PublishMusicData.messages.publishStarted"));
                    setModalOpen(false);
                })
                .catch(() => {
                    message.error(t("PublishMusicData.messages.publishError"));
                })
                .finally(() => {
                    setSubmitting(false);
                });
    }, [action, t, trackTask]);

    return (
            <Space orientation={"vertical"} style={{width: "95%", padding: 24}}>
                <Title level={3}>{t("PublishMusicData.header.title")}</Title>
                <SplitActionButton
                        actions={actions.map(item => ({...item, onClick: () => setModalOpen(true)}))}
                        selectedActionKey={action}
                        onActionSelect={setAction}
                        loading={submitting}
                        menuLabel={t("Common.splitButton.menu", {defaultValue: "Choose action"})}
                        data-testid="music-create"
                />
                <PublishDataSetModal
                        open={modalOpen}
                        identifier={MUSIC_DATA_SET_IDENTIFIER}
                        title={t("PublishMusicData.modal.title", {defaultValue: "Music data set"})}
                        description={t("PublishMusicData.modal.description", {
                            defaultValue: "The music data set is generated from every music file and stored in Vempain Admin."
                        })}
                        okText={actionLabel}
                        submitting={submitting}
                        onCancel={() => setModalOpen(false)}
                        onSubmit={handleCreate}
                />
            </Space>
    );
}
