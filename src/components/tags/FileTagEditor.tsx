import {Button, Card, Input, message, Select, Space, Tabs} from "antd";
import {useState} from "react";
import {tagAPI} from "../../services";
import type {TagOperationRequest, TagResponse} from "../../models";
import {useTranslation} from "react-i18next";

type Action = "add" | "rename" | "replace" | "remove";
type TagFields = Pick<TagOperationRequest, "tag_name" | "tag_name_de" | "tag_name_en" | "tag_name_es" | "tag_name_fi" | "tag_name_sv">;

const emptyTag: TagFields = {
    tag_name: "",
    tag_name_de: "",
    tag_name_en: "",
    tag_name_es: "",
    tag_name_fi: "",
    tag_name_sv: ""
};

export function FileTagEditor() {
    const {t} = useTranslation();
    const [tags, setTags] = useState<TagResponse[]>([]);
    const [tagFields, setTagFields] = useState<TagFields>(emptyTag);
    const [renameFields, setRenameFields] = useState<TagFields>(emptyTag);
    const [selectedTag, setSelectedTag] = useState<string>();
    const [replacementTag, setReplacementTag] = useState<string>();
    const [fileIds, setFileIds] = useState<number[]>([]);
    const [activeAction, setActiveAction] = useState<Action>("add");
    const [loading, setLoading] = useState(false);

    const loadTags = () => tagAPI.findAll()
            .then(setTags)
            .catch((error: unknown) => message.error(t("FileTagEditor.messages.fetchError", {error: String(error)})));

    const tagOptions = [...tags]
            .sort((first, second) => first.tag_name.localeCompare(second.tag_name))
            .map(tag => ({label: tag.tag_name, value: tag.tag_name}));

    const updateField = (field: keyof TagFields, value: string) => {
        setTagFields(current => ({...current, [field]: value}));
    };

    const copyDefaultToLanguages = () => {
        setTagFields(current => ({
            ...current,
            tag_name_de: current.tag_name,
            tag_name_en: current.tag_name,
            tag_name_es: current.tag_name,
            tag_name_fi: current.tag_name,
            tag_name_sv: current.tag_name
        }));
    };

    const updateRenameField = (field: keyof TagFields, value: string) => {
        setRenameFields(current => ({...current, [field]: value}));
    };

    const copyRenameDefaultToLanguages = () => {
        setRenameFields(current => ({
            ...current,
            tag_name_de: current.tag_name,
            tag_name_en: current.tag_name,
            tag_name_es: current.tag_name,
            tag_name_fi: current.tag_name,
            tag_name_sv: current.tag_name
        }));
    };

    const submit = () => {
        if (fileIds.length === 0 || (activeAction === "add" ? !tagFields.tag_name : !selectedTag)) {
            message.error(t("FileTagEditor.messages.required"));
            return;
        }
        if (activeAction === "rename" && !renameFields.tag_name) {
            message.error(t("FileTagEditor.messages.replacementRequired"));
            return;
        }
        if (activeAction === "replace" && !replacementTag) {
            message.error(t("FileTagEditor.messages.replacementRequired"));
            return;
        }

        const request: TagOperationRequest = activeAction === "add"
                ? {...tagFields, file_ids: fileIds}
                : activeAction === "rename"
                        ? {
                            tag_name: selectedTag as string,
                            replacement_tag_name: renameFields.tag_name,
                            tag_name_de: renameFields.tag_name_de,
                            tag_name_en: renameFields.tag_name_en,
                            tag_name_es: renameFields.tag_name_es,
                            tag_name_fi: renameFields.tag_name_fi,
                            tag_name_sv: renameFields.tag_name_sv,
                            file_ids: fileIds
                        }
                        : {
                            tag_name: selectedTag as string,
                            replacement_tag_name: replacementTag,
                            file_ids: fileIds
                        };
        const operation = activeAction === "add" ? tagAPI.addTag(request)
                : activeAction === "remove" ? tagAPI.removeTag(request)
                        : activeAction === "replace" ? tagAPI.replaceTag(request) : tagAPI.renameTag(request);
        setLoading(true);
        operation.then(() => message.success(t("FileTagEditor.messages.success")))
                .catch((error: unknown) => message.error(t("FileTagEditor.messages.failed", {error: String(error)})))
                .finally(() => setLoading(false));
    };

    const fileSelection = (
            <Select
                    mode="tags"
                    style={{width: "100%"}}
                    placeholder={t("FileTagEditor.fields.files")}
                    value={fileIds.map(String)}
                    onChange={values => setFileIds(values.map(Number).filter(Number.isInteger))}
            />
    );

    const tagSelector = (placeholder: string, value: string | undefined, onChange: (value: string) => void) => (
            <Select
                    showSearch
                    style={{width: "100%"}}
                    placeholder={placeholder}
                    options={tagOptions}
                    value={value}
                    onChange={onChange}
            />
    );

    const addContent = (
            <Space direction="vertical" style={{width: "100%"}}>
                {(["tag_name", "tag_name_de", "tag_name_en", "tag_name_es", "tag_name_fi", "tag_name_sv"] as const).map(field =>
                        <Input
                                key={field}
                                placeholder={t(`FileTagEditor.fields.${field}`)}
                                value={tagFields[field]}
                                onChange={event => updateField(field, event.target.value)}
                        />
                )}
                <Button onClick={copyDefaultToLanguages}>{t("FileTagEditor.actions.copyDefault")}</Button>
                {fileSelection}
                <Button type="primary" loading={loading} onClick={submit}>{t("FileTagEditor.actions.apply")}</Button>
            </Space>
    );

    const replaceContent = (
            <Space direction="vertical" style={{width: "100%"}}>
                {tagSelector(t("FileTagEditor.fields.sourceTag"), selectedTag, setSelectedTag)}
                {tagSelector(t("FileTagEditor.fields.targetTag"), replacementTag, setReplacementTag)}
                {fileSelection}
                <Button type="primary" loading={loading} onClick={submit}>{t("FileTagEditor.actions.apply")}</Button>
            </Space>
    );

    const renameContent = (
            <Space direction="vertical" style={{width: "100%"}}>
                {tagSelector(t("FileTagEditor.fields.sourceTag"), selectedTag, setSelectedTag)}
                {(["tag_name", "tag_name_de", "tag_name_en", "tag_name_es", "tag_name_fi", "tag_name_sv"] as const).map(field =>
                        <Input
                                key={field}
                                placeholder={field === "tag_name" ? t("FileTagEditor.fields.newName") : t(`FileTagEditor.fields.${field}`)}
                                value={renameFields[field]}
                                onChange={event => updateRenameField(field, event.target.value)}
                        />
                )}
                <Button onClick={copyRenameDefaultToLanguages}>{t("FileTagEditor.actions.copyDefault")}</Button>
                {fileSelection}
                <Button type="primary" loading={loading} onClick={submit}>{t("FileTagEditor.actions.apply")}</Button>
            </Space>
    );

    const removeContent = (
            <Space direction="vertical" style={{width: "100%"}}>
                {tagSelector(t("FileTagEditor.fields.tag"), selectedTag, setSelectedTag)}
                {fileSelection}
                <Button danger type="primary" loading={loading} onClick={submit}>{t("FileTagEditor.actions.remove")}</Button>
            </Space>
    );

    return (
            <Card title={t("FileTagEditor.title")} style={{margin: 30}}>
                <Space direction="vertical" style={{width: "100%"}}>
                    <Tabs
                            activeKey={activeAction}
                            onChange={key => {
                                const action = key as Action;
                                setActiveAction(action);
                                if (action !== "add") {
                                    loadTags();
                                }
                            }}
                            items={[
                                {key: "add", label: t("FileTagEditor.actions.add"), children: addContent},
                                {key: "rename", label: t("FileTagEditor.actions.rename"), children: renameContent},
                                {key: "replace", label: t("FileTagEditor.actions.replace"), children: replaceContent},
                                {key: "remove", label: t("FileTagEditor.actions.remove"), children: removeContent}
                            ]}
                    />
                </Space>
            </Card>
    );
}
