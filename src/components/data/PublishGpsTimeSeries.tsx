import {Button, message, Select, Space, Spin, Typography} from "antd";
import {type UIEvent, useCallback, useEffect, useRef, useState} from "react";
import {dataAPI, fileGroupAPI} from "../../services";
import type {FileGroupListResponse} from "../../models";
import {useTranslation} from "react-i18next";
import type {PagedRequest} from "@vempain/vempain-auth-frontend";
import {fileGroupDatasetToIdentifier} from "../../tools";

const {Title, Text} = Typography;
const {Option} = Select;
const PAGE_SIZE = 200;

export function PublishGpsTimeSeries() {
    const {t} = useTranslation();
    const [loadingGroups, setLoadingGroups] = useState<boolean>(true);
    const [imageGroups, setImageGroups] = useState<FileGroupListResponse[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [hasMorePages, setHasMorePages] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(undefined);
    const [publishing, setPublishing] = useState<boolean>(false);
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
        fileGroupAPI.getFileGroups(pagedRequest)
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

    const handlePublish = useCallback(() => {
        if (!identifier || !selectedGroupId) {
            message.warning(t("PublishGpsTimeSeries.messages.selectWarning"));
            return;
        }
        setPublishing(true);
        dataAPI.publishGpsTimeSeries(selectedGroupId, identifier)
                .then(() => {
                    message.success(t("PublishGpsTimeSeries.messages.publishSuccess"));
                })
                .catch(() => {
                    message.error(t("PublishGpsTimeSeries.messages.publishError"));
                })
                .finally(() => {
                    setPublishing(false);
                });
    }, [identifier, selectedGroupId, t]);

    return (
            <Space orientation={"vertical"} style={{width: "95%", padding: 24}}>
                <Title level={3}>{t("PublishGpsTimeSeries.header.title")}</Title>
                <Spin spinning={loadingGroups}>
                    <Space orientation={"vertical"} style={{width: "95%"}}>
                        <Text>{t("PublishGpsTimeSeries.select.label")}</Text>
                        <Select
                                style={{width: 400}}
                                placeholder={t("PublishGpsTimeSeries.select.placeholder")}
                                showSearch
                                filterOption={false}
                                onSearch={handleSearch}
                                onPopupScroll={handleDropdownScroll}
                                onChange={(value: number | undefined) => setSelectedGroupId(value)}
                                value={selectedGroupId}
                                loading={loadingGroups}
                                allowClear
                        >
                            {imageGroups.map(group => (
                                    <Option key={group.id} value={group.id}>
                                        {group.path} {group.group_name ? `(${group.group_name})` : ""}
                                    </Option>
                            ))}
                        </Select>
                        {identifier && (
                                <Text type="secondary">
                                    {t("PublishGpsTimeSeries.fields.derivedIdentifier")}: <strong>{identifier}</strong>
                                </Text>
                        )}
                        <Button
                                type="primary"
                                loading={publishing}
                                disabled={!selectedGroupId}
                                onClick={handlePublish}
                        >
                            {t("PublishGpsTimeSeries.actions.publish")}
                        </Button>
                    </Space>
                </Spin>
            </Space>
    );
}
