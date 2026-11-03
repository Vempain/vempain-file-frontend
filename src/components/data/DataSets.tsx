import {Space, Switch, Tag, Typography} from "antd";
import {useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import {usePagedTable, type VempainColumnsType, VempainTable} from "@vempain/vempain-auth-frontend";
import {dataAPI} from "../../services";
import type {DataSummaryResponse} from "../../models";
import {formatDateWithTimeZone, stickyTableHeader} from "../../tools";

const {Title, Text} = Typography;

/**
 * The data sets this backend created in the admin backend (music library, GPS time series), as a server-paged table like the typed file
 * lists: the admin backend filters (column search, "modified after publish"), sorts and pages them (POST /data-publish/paged). The
 * sets are created from the music and GPS screens; this table shows what exists and whether it was released to the website.
 */
export function DataSets() {
    const {t} = useTranslation();
    const [modifiedAfterPublish, setModifiedAfterPublish] = useState<boolean>(false);

    const paged = usePagedTable<DataSummaryResponse>(request => dataAPI.findPageableDataSets({...request, modified_after_publish: modifiedAfterPublish}), {
        defaultSortBy: "identifier",
        defaultDirection: "ASC",
        defaultPageSize: 25,
        deps: [modifiedAfterPublish]
    });

    const notReleased = t("DataSets.values.notReleased", {defaultValue: "Not released"});
    // identifier, type and description carry the backend's column search; the timestamps only sort
    const columns: VempainColumnsType<DataSummaryResponse> = useMemo(() => [
        {title: t("DataSets.columns.identifier", {defaultValue: "Identifier"}), dataIndex: "identifier", key: "identifier", sorter: true, defaultSortOrder: "ascend"},
        {title: t("DataSets.columns.type", {defaultValue: "Type"}), dataIndex: "type", key: "type", sorter: true, render: (_, record) => <Tag>{record.type}</Tag>},
        {
            title: t("DataSets.columns.description", {defaultValue: "Description"}), dataIndex: "description", key: "description", sorter: true,
            render: (_, record) => record.description ?? "-"
        },
        {
            title: t("DataSets.columns.generated", {defaultValue: "Generated"}), dataIndex: "generated", key: "generated", sorter: true, searchable: false,
            render: (_, record) => formatDateWithTimeZone(record.generated)
        },
        {
            title: t("DataSets.columns.created", {defaultValue: "Created"}), dataIndex: "created", key: "created", sorter: true, searchable: false,
            render: (_, record) => formatDateWithTimeZone(record.created)
        },
        {
            title: t("DataSets.columns.modified", {defaultValue: "Modified"}), dataIndex: "modified", key: "modified", sorter: true, searchable: false,
            render: (_, record) => record.modified === null ? "-" : formatDateWithTimeZone(record.modified)
        },
        {
            title: t("DataSets.columns.published", {defaultValue: "Released"}), dataIndex: "published", key: "published", sorter: true, searchable: false,
            render: (_, record) => record.published ? formatDateWithTimeZone(record.published) : notReleased
        }
    ], [notReleased, t]);

    return (
            <Space orientation={"vertical"} style={{width: "95%", padding: 24}}>
                <Title level={3}>{t("DataSets.header.title", {defaultValue: "Data sets"})}</Title>
                <Text type="secondary">
                    {t("DataSets.header.description", {
                        defaultValue: "The data sets created in Vempain Admin from the music files and the GPS-tagged images, and whether they were released to the website."
                    })}
                </Text>
                <Space size={8}>
                    <Switch checked={modifiedAfterPublish} onChange={setModifiedAfterPublish}
                            aria-label={t("DataSets.filters.modifiedAfterPublish", {defaultValue: "Only modified after publish"})}/>
                    <Text>{t("DataSets.filters.modifiedAfterPublish", {defaultValue: "Only modified after publish"})}</Text>
                </Space>
                {paged.contextHolder}
                <VempainTable<DataSummaryResponse>
                        sticky={stickyTableHeader}
                        rowKey={(record) => record.identifier}
                        columns={columns}
                        dataMode={"server"}
                        paged={paged}
                        loading={paged.loading}
                        size="small"
                        data-testid="data-sets-table"
                />
            </Space>
    );
}
