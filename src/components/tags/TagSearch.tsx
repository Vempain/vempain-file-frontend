import {Button, Input, Space, Table} from "antd";
import type {ColumnsType} from "antd/es/table";
import {useState} from "react";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";
import type {TagResponse} from "../../models";
import {tagAPI} from "../../services";

export function TagSearch() {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [tags, setTags] = useState<TagResponse[]>([]);
    const [loading, setLoading] = useState(false);

    const search = () => {
        setLoading(true);
        tagAPI.findPageable({
            page: 0, size: 100, sort_by: "tag_name", direction: "ASC", case_sensitive: false,
            ...(query.trim() ? {search: query.trim()} : {})
        })
                .then(response => setTags(response.content ?? []))
                .catch(() => setTags([]))
                .finally(() => setLoading(false));
    };
    const columns: ColumnsType<TagResponse> = [
        {title: t("TagSearch.columns.name", {defaultValue: "Tag name"}), dataIndex: "tag_name", key: "tag_name"},
        {
            title: t("TagSearch.columns.languages", {defaultValue: "Translations"}), key: "languages",
            render: (_value, record) => [record.tag_name_de, record.tag_name_en, record.tag_name_es, record.tag_name_fi, record.tag_name_sv].filter(Boolean).join(", ")
        },
        {
            title: t("Common.modal.actions", {defaultValue: "Actions"}), key: "actions",
            render: (_value, record) => <Button onClick={() => navigate(`/tags/${record.id}/edit`)}>{t("Common.modal.edit", {defaultValue: "Edit"})}</Button>
        }
    ];
    return <Space direction="vertical" style={{width: "95%", margin: 30}} size="large">
        <h1>{t("TagSearch.title", {defaultValue: "Search tags"})}</h1>
        <Space.Compact style={{width: "100%"}}>
            <Input value={query} onChange={event => setQuery(event.target.value)}
                   onPressEnter={search} placeholder={t("TagSearch.placeholder", {defaultValue: "Search tag names"})}/>
            <Button type="primary" onClick={search}>{t("Common.search", {defaultValue: "Search"})}</Button>
        </Space.Compact>
        <Table rowKey="id" columns={columns} dataSource={tags} loading={loading}/>
    </Space>;
}
