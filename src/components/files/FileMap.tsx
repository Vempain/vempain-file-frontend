import 'leaflet/dist/leaflet.css';
import {Typography} from "antd";
import {useMemo} from "react";
import {useTranslation} from "react-i18next";
import {MapView} from "@vempain/vempain-common-frontend";
import {mapAPI, tagAPI} from "../../services";
import {FileTypeEnum} from "../../models";
import {MAP_ATTRIBUTION, MAP_TILE_URL, toFileDetails} from "../../tools";
import {FileDetails} from "./FileDetails";
import {FileDisplay} from "./FileDisplay";

const {Title, Text} = Typography;

/** The file types that can carry GPS coordinates and are worth a filter on the map */
const MAP_FILE_TYPES = [FileTypeEnum.IMAGE, FileTypeEnum.VIDEO, FileTypeEnum.AUDIO, FileTypeEnum.MUSIC, FileTypeEnum.DOCUMENT, FileTypeEnum.VECTOR,
    FileTypeEnum.DATA, FileTypeEnum.ARCHIVE, FileTypeEnum.BINARY, FileTypeEnum.EXECUTABLE, FileTypeEnum.FONT, FileTypeEnum.ICON, FileTypeEnum.INTERACTIVE,
    FileTypeEnum.UNKNOWN] as const;

/**
 * The map of the original files with GPS coordinates (File management > Map): the shared map view of vempain-common-frontend over this
 * backend's /map endpoints. A clicked file opens the details of the typed file lists with its thumbnail (the thumb file through the content
 * endpoint, the file itself when it has none).
 */
export function FileMap() {
    const {t} = useTranslation();
    const fileTypes = useMemo(() => MAP_FILE_TYPES.map(type => ({value: type, label: t(`FileTypeEnum.${type.toLowerCase()}`, {defaultValue: type})})), [t]);

    return (
            <div style={{padding: 24}}>
                <Title level={3}>{t("FileMap.header.title", {defaultValue: "Map of files"})}</Title>
                <Text type="secondary">
                    {t("FileMap.header.description", {
                        defaultValue: "Every file with GPS coordinates you may read; the points are clustered by the backend, zoom in or hover a cluster to see the files."
                    })}
                </Text>
                <MapView
                        source={mapAPI}
                        fileTypes={fileTypes}
                        tileUrl={MAP_TILE_URL}
                        attribution={MAP_ATTRIBUTION}
                        searchTags={search => tagAPI.findPageable({page: 0, size: 20, search, sort_by: "tag_name", direction: "ASC"})
                                .then(page => page.content.map(tag => tag.tag_name))}
                        renderThumbnail={file => <FileDisplay id={file.thumbnail_id ?? file.id} maxSize={240}/>}
                        renderFileDetails={file => <FileDetails file={toFileDetails(file)}/>}
                />
            </div>
    );
}
