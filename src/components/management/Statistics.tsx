import {Column, Line} from "@ant-design/charts";
import {Card, Col, message, Row, Space, Spin, Statistic, Table, Typography} from "antd";
import type {ColumnsType} from "antd/es/table";
import {useCallback, useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import type {FileStatisticsResponse} from "../../models";
import {statisticsAPI} from "../../services";

const {Title, Paragraph, Text} = Typography;

interface TypeRow {
    key: string;
    file_type: string;
    file_count: number;
    largest_file_size: number;
    average_file_size: number;
}

const formatBytes = (value: number): string => {
    if (value < 1024) return `${value} B`;
    const units = ["KB", "MB", "GB", "TB"];
    let size = value;
    let unit = "B";
    for (const candidate of units) {
        size /= 1024;
        unit = candidate;
        if (size < 1024) break;
    }
    return `${size.toFixed(2)} ${unit}`;
};

export function Statistics() {
    const {t} = useTranslation();
    const [statistics, setStatistics] = useState<FileStatisticsResponse>();
    const [loading, setLoading] = useState(true);

    const loadStatistics = useCallback(() => {
        setLoading(true);
        statisticsAPI.getStatistics()
                .then(setStatistics)
                .catch(() => message.error(t("Statistics.messages.fetchError", {defaultValue: "Failed to load statistics"})))
                .finally(() => setLoading(false));
    }, [t]);

    useEffect(() => {
        loadStatistics();
    }, [loadStatistics]);

    const typeRows = useMemo<TypeRow[]>(() => {
        if (!statistics) return [];
        return Object.entries(statistics.files_by_type).map(([file_type, file_count]) => ({
            key: file_type,
            file_type,
            file_count,
            largest_file_size: statistics.largest_file_size_by_type[file_type] ?? 0,
            average_file_size: statistics.average_file_size_by_type[file_type] ?? 0,
        }));
    }, [statistics]);

    const yearChartData = useMemo(() => {
        if (!statistics) return [];
        return Object.entries(statistics.files_by_type_and_year)
                .flatMap(([file_type, years]) =>
                        Object.entries(years).map(([creation_year, file_count]) => ({
                            year: Number(creation_year),
                            file_type,
                            files: file_count,
                        }))
                )
                .sort((left, right) => left.year - right.year || left.file_type.localeCompare(right.file_type));
    }, [statistics]);

    const typeColumns: ColumnsType<TypeRow> = [
        {title: t("Statistics.columns.fileType", {defaultValue: "File type"}), dataIndex: "file_type"},
        {title: t("Statistics.columns.fileCount", {defaultValue: "Files"}), dataIndex: "file_count"},
        {
            title: t("Statistics.columns.largestFile", {defaultValue: "Largest file"}),
            dataIndex: "largest_file_size",
            render: formatBytes,
        },
        {
            title: t("Statistics.columns.averageFile", {defaultValue: "Average file"}),
            dataIndex: "average_file_size",
            render: formatBytes,
        },
    ];
    const typeChartData = typeRows.map(row => ({type: row.file_type, files: row.file_count}));
    const chartColors = ["#50b0ff", "#ff8a65", "#ffd166", "#7bd389", "#c77dff", "#f78fb3", "#4dd0e1", "#ffb703"];
    const chartAxis = {
        x: {labelFill: "#f0f0f0", tickStroke: "#a8a8a8", lineStroke: "#a8a8a8"},
        y: {labelFill: "#f0f0f0", tickStroke: "#a8a8a8", lineStroke: "#a8a8a8"},
    };

    return (
            <Spin spinning={loading}>
                <Space orientation="vertical" size="large" style={{width: "95%", padding: 24}}>
                    <div>
                        <Title level={2}>{t("Statistics.title", {defaultValue: "File database statistics"})}</Title>
                        <Paragraph>{t("Statistics.description", {defaultValue: "A summary of the files, metadata, groups, and storage represented in the file database."})}</Paragraph>
                    </div>
                    {statistics && <>
                        <Card title={t("Statistics.sections.overview.title", {defaultValue: "Overview"})}>
                            <Paragraph
                                    type="secondary">{t("Statistics.sections.overview.description", {defaultValue: "Counts and storage totals for all files currently read into the database."})}</Paragraph>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} sm={12} lg={6}><Statistic title={t("Statistics.totalFiles", {defaultValue: "Total files"})}
                                                                       value={statistics.total_files}/></Col>
                                <Col xs={24} sm={12} lg={6}><Statistic title={t("Statistics.totalFileSize", {defaultValue: "Total file size"})}
                                                                       value={formatBytes(statistics.total_file_size)}/></Col>
                                <Col xs={24} sm={12} lg={6}><Statistic title={t("Statistics.largestFileSize", {defaultValue: "Largest file"})}
                                                                       value={formatBytes(statistics.largest_file_size)}/></Col>
                                <Col xs={24} sm={12} lg={6}><Statistic title={t("Statistics.averageFileSize", {defaultValue: "Average file size"})}
                                                                       value={formatBytes(statistics.average_file_size)}/></Col>
                            </Row>
                        </Card>
                        <Card title={t("Statistics.sections.types.title", {defaultValue: "Files by type"})}>
                            <Paragraph
                                    type="secondary">{t("Statistics.sections.types.description", {defaultValue: "The number and size distribution of files in each file type."})}</Paragraph>
                            <Column data={typeChartData} xField="type" yField="files" colorField="type"
                                    scale={{color: {range: chartColors}}} theme="classicDark" axis={chartAxis} height={280}/>
                            <Table columns={typeColumns} dataSource={typeRows} pagination={false} size="small"/>
                        </Card>
                        <Card title={t("Statistics.sections.years.title", {defaultValue: "Files by type and creation year"})}>
                            <Paragraph
                                    type="secondary">{t("Statistics.sections.years.description", {defaultValue: "File counts grouped by file type and the original creation year when available."})}</Paragraph>
                            <Line data={yearChartData} xField="year" yField="files" colorField="file_type"
                                  scale={{color: {range: chartColors}}} theme="classicDark" axis={chartAxis} height={280}/>
                        </Card>
                        <Card title={t("Statistics.sections.metadata.title", {defaultValue: "Metadata and groups"})}>
                            <Paragraph
                                    type="secondary">{t("Statistics.sections.metadata.description", {defaultValue: "Counts of tags, locations, and the distribution of files across file groups."})}</Paragraph>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} sm={12} lg={4}><Statistic title={t("Statistics.totalTags", {defaultValue: "Tags"})} value={statistics.total_tags}/></Col>
                                <Col xs={24} sm={12} lg={4}><Statistic title={t("Statistics.totalGpsLocations", {defaultValue: "GPS locations"})}
                                                                       value={statistics.total_gps_locations}/></Col>
                                <Col xs={24} sm={12} lg={4}><Statistic title={t("Statistics.filesWithGps", {defaultValue: "Files with GPS"})}
                                                                       value={statistics.files_with_gps_locations}/></Col>
                                <Col xs={24} sm={12} lg={4}><Statistic title={t("Statistics.filesWithTags", {defaultValue: "Files with tags"})}
                                                                       value={statistics.files_with_tags}/></Col>
                                <Col xs={24} sm={12} lg={4}><Statistic title={t("Statistics.largestGroup", {defaultValue: "Largest group"})}
                                                                       value={statistics.largest_file_group_size}/></Col>
                                <Col xs={24} sm={12} lg={4}><Statistic title={t("Statistics.smallestGroup", {defaultValue: "Smallest group"})}
                                                                       value={statistics.smallest_file_group_size}/></Col>
                            </Row>
                            <Text type="secondary">{t("Statistics.averageGroup", {defaultValue: "Average group size"})}: {statistics.average_file_group_size.toFixed(2)}</Text>
                        </Card>
                    </>}
                </Space>
            </Spin>
    );
}
