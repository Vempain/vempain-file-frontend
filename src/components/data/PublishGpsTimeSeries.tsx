import {message, Select, Space, Spin, Typography} from "antd";
import {type UIEvent, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {dataAPI, fileGroupAPI} from "../../services";
import type {FileGroupListResponse, PublishAclRequest} from "../../models";
import {useTranslation} from "react-i18next";
import {SplitActionButton, useTaskProgress} from "@vempain/vempain-common-frontend";
import {CREATE_ACTION, CREATE_AND_PUBLISH_ACTION, createActions} from "../common/createActions";
import {PublishDataSetModal} from "./PublishDataSetModal";
import type {PagedRequest} from "@vempain/vempain-auth-frontend";
import {fileGroupDatasetToIdentifier} from "../../tools";

const {Title, Text} = Typography;
const PAGE_SIZE = 200;

export function PublishGpsTimeSeries() {
    const {t} = useTranslation();
    const {trackTask} = useTaskProgress();
    const [loadingGroups, setLoadingGroups] = useState<boolean>(true);
    const [imageGroups, setImageGroups] = useState<FileGroupListResponse[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [hasMorePages, setHasMorePages] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(undefined);
    const [publishing, setPublishing] = useState<boolean>(false);
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    // Create the data set in the admin backend, or create it and start its publishing to the website as well
    const [action, setAction] = useState<string>(CREATE_ACTION);
    const actions = useMemo(() => createActions(t, "PublishGpsTimeSeries", "Create GPS time series", "Create and publish GPS time series"), [t]);
    const actionLabel = actions.find(item => item.key === action)?.label ?? "";
    const requestIdRef = useRef<number>(0);
    const searchDebounceRef = useRef<number | null>(null);

    const fetchImageGroups = useCallback((page: number, search: string, append: boolean) => {
        setLoadingGroups(true);
        const requestId = ++requestIdRef.current;
        const pagedRequest: PagedRequest = {
            page,
            size: PAGE_SIZE,
            sort_by: "path",
            direction: "ASC",
            search: search.trim() === "" ? undefined : search,
            case_sensitive: false,
        };
        fileGroupAPI.findPageable(pagedRequest)
                .then((data) => {
                    if (requestId !== requestIdRef.current) {
                        return;
                    }
                    const content = data.content ?? [];
                    setImageGroups((previous) => {
                        if (!append) {
                            return content;
                        }
                        const existingIds = new Set(previous.map((item) => item.id));
                        const nextItems = content.filter((item) => !existingIds.has(item.id));
                        return [...previous, ...nextItems];
                    });
                    setCurrentPage(data.page);
                    setHasMorePages(!data.last);
                })
                .catch(() => {
                    if (requestId === requestIdRef.current) {
                        message.error(t("PublishGpsTimeSeries.messages.fetchGroupsError"));
                    }
                })
                .finally(() => {
                    if (requestId === requestIdRef.current) {
                        setLoadingGroups(false);
                    }
                });
    }, [t]);

    useEffect(() => {
        fetchImageGroups(0, "", false);
    }, [fetchImageGroups]);

    useEffect(() => {
        return () => {
            if (searchDebounceRef.current !== null) {
                window.clearTimeout(searchDebounceRef.current);
            }
        };
    }, []);

    const selectedGroup = imageGroups.find(g => g.id === selectedGroupId);
    const identifier = selectedGroup
            ? fileGroupDatasetToIdentifier(selectedGroup.path, selectedGroup.group_name)
            : undefined;

    const handleSearch = useCallback((value: string) => {
        setSearchTerm(value);
        setCurrentPage(0);
        setHasMorePages(true);

        if (searchDebounceRef.current !== null) {
            window.clearTimeout(searchDebounceRef.current);
        }
        searchDebounceRef.current = window.setTimeout(() => {
            fetchImageGroups(0, value, false);
        }, 250);
    }, [fetchImageGroups]);

    const handleDropdownScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
        if (loadingGroups || !hasMorePages) {
            return;
        }

        const target = event.target as HTMLDivElement;
        const reachedEnd = target.scrollTop + target.offsetHeight >= target.scrollHeight - 8;
        if (reachedEnd) {
            fetchImageGroups(currentPage + 1, searchTerm, true);
        }
    }, [currentPage, fetchImageGroups, hasMorePages, loadingGroups, searchTerm]);

    // The split button opens the dialog that asks which admin users and units get access to the data set
    const openModal = useCallback(() => {
        if (!identifier || !selectedGroupId) {
            message.warning(t("PublishGpsTimeSeries.messages.selectWarning"));
            return;
        }
        setModalOpen(true);
    }, [identifier, selectedGroupId, t]);

    const handlePublish = useCallback((acls: PublishAclRequest[]) => {
        if (!identifier || !selectedGroupId) {
            message.warning(t("PublishGpsTimeSeries.messages.selectWarning"));
            return;
        }
        setPublishing(true);
        // The data set is generated and uploaded as a background task shown in the task tray
        dataAPI.publishGpsTimeSeries(selectedGroupId, identifier, action === CREATE_AND_PUBLISH_ACTION, acls)
                .then(accepted => {
                    trackTask(accepted);
                    message.success(t("PublishGpsTimeSeries.messages.publishStarted"));
                    setModalOpen(false);
                })
                .catch(() => {
                    message.error(t("PublishGpsTimeSeries.messages.publishError"));
                })
                .finally(() => {
                    setPublishing(false);
                });
    }, [action, identifier, selectedGroupId, t, trackTask]);

    return (
            <Space orientation={"vertical"} style={{width: "95%", padding: 24}}>
                <Title level={3}>{t("PublishGpsTimeSeries.header.title")}</Title>
                <Spin spinning={loadingGroups}>
                    <Space orientation={"vertical"} style={{width: "95%"}}>
                        <Text>{t("PublishGpsTimeSeries.select.label")}</Text>
                        <Select
                                style={{width: 400}}
                                placeholder={t("PublishGpsTimeSeries.select.placeholder")}
                                showSearch={{filterOption: false, onSearch: handleSearch}}
                                onPopupScroll={handleDropdownScroll}
                                onChange={(value: number | undefined) => setSelectedGroupId(value)}
                                value={selectedGroupId}
                                loading={loadingGroups}
                                allowClear
                                options={imageGroups.map(group => ({
                                    value: group.id,
                                    label: `${group.path} ${group.group_name ? `(${group.group_name})` : ""}`
                                }))}
                        />
                        {identifier && (
                                <Text type="secondary">
                                    {t("PublishGpsTimeSeries.fields.derivedIdentifier")}: <strong>{identifier}</strong>
                                </Text>
                        )}
                        <SplitActionButton
                                actions={actions.map(item => ({...item, onClick: openModal}))}
                                selectedActionKey={action}
                                onActionSelect={setAction}
                                loading={publishing}
                                disabled={!selectedGroupId}
                                menuLabel={t("Common.splitButton.menu", {defaultValue: "Choose action"})}
                                data-testid="gps-create"
                        />
                    </Space>
                </Spin>
                <PublishDataSetModal
                        open={modalOpen}
                        identifier={identifier ?? ""}
                        title={t("PublishGpsTimeSeries.modal.title", {defaultValue: "GPS time series data set"})}
                        description={t("PublishGpsTimeSeries.modal.description", {
                            defaultValue: "The GPS time series is generated from the published GPS-tagged images of {{group}} and stored in Vempain Admin.",
                            group: selectedGroup ? `${selectedGroup.path} ${selectedGroup.group_name ? `(${selectedGroup.group_name})` : ""}`.trim() : ""
                        })}
                        okText={actionLabel}
                        submitting={publishing}
                        onCancel={() => setModalOpen(false)}
                        onSubmit={handlePublish}
                />
            </Space>
    );
}
