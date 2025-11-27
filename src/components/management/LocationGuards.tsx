import {useEffect, useMemo, useState} from "react";
import {Button, Col, Divider, Form, InputNumber, message, Modal, Popconfirm, Row, Select, Space, Table, Tag, Typography} from "antd";
import type {ColumnsType} from "antd/es/table";
import {locationAPI} from "../../services";
import type {GeoCoordinate, LocationGuardRequest, LocationGuardResponse} from "../../models";
import {GuardTypeEnum} from "../../models";

// react-leaflet map picker
import {CircleMarker, MapContainer, TileLayer, useMap, useMapEvents} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {LocationAPI} from "../../services/LocationAPI.ts";
import {useTranslation} from "react-i18next";

const {Title, Text} = Typography;

type GuardFormValues = {
    guard_type: typeof GuardTypeEnum[keyof typeof GuardTypeEnum];
    primary_coordinate: GeoCoordinate;
    secondary_coordinate?: GeoCoordinate | null;
    radius?: number | null;
};

function formatCoord(coord?: GeoCoordinate | null): string {
    if (!coord) return "—";
    const {latitude, longitude} = coord;
    if (typeof latitude !== "number" || typeof longitude !== "number") return "—";
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

function typeTag(type: GuardFormValues["guard_type"]) {
    const color = type === GuardTypeEnum.CIRCLE ? "geekblue" : "purple";
    return <Tag color={color}>{type}</Tag>;
}

function ClickHandler({onSelect}: { onSelect: (coord: GeoCoordinate) => void }) {
    useMapEvents({
        click(e) {
            const lat = LocationAPI.round5(e.latlng.lat);
            const lng = LocationAPI.round5(e.latlng.lng);
            if (lat !== null && lng !== null) {
                onSelect({latitude: lat, longitude: lng});
            }
        },
    });
    return null;
}

function MapPicker({
                       value,
                       onChange,
                       height = 220,
                       readOnly = false,
                       active = false,
                   }: {
    value?: GeoCoordinate | null;
    onChange?: (coord: GeoCoordinate) => void;
    height?: number;
    readOnly?: boolean;
    active?: boolean; // whether the modal/popover is open
}) {
    const center = useMemo<[number, number]>(() => {
        if (value && typeof value.latitude === "number" && typeof value.longitude === "number") {
            return [value.latitude, value.longitude];
        }
        // Default: Helsinki
        return [60.1699, 24.9384];
    }, [value]);

    // Helper to invalidate size after modal open and recenter on coord change
    function MapEffects({activeDep, centerDep}: { activeDep: boolean; centerDep: [number, number] }) {
        const map = useMap();
        useEffect(() => {
            if (activeDep) {
                // Delay to allow modal animation/layout to finish
                const t = setTimeout(() => map.invalidateSize(), 80);
                return () => clearTimeout(t);
            }
        }, [activeDep, map]);
        useEffect(() => {
            map.setView(centerDep);
        }, [centerDep[0], centerDep[1], map]);
        return null;
    }

    return (
            <div style={{height, width: "100%", border: "1px solid #eee", borderRadius: 6, overflow: "hidden"}}>
                <MapContainer center={center} zoom={value ? 12 : 10} style={{height: "100%", width: "100%"}}>
                    <TileLayer
                            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapEffects activeDep={active} centerDep={center}/>
                    {value && typeof value.latitude === "number" && typeof value.longitude === "number" && (
                            <CircleMarker center={[value.latitude, value.longitude]} radius={8} pathOptions={{color: "#1677ff"}}/>
                    )}
                    {!readOnly && onChange && <ClickHandler onSelect={onChange}/>}
                </MapContainer>
            </div>
    );
}

export function LocationGuards() {
    const [loading, setLoading] = useState(false);
    const [guards, setGuards] = useState<LocationGuardResponse[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editing, setEditing] = useState<LocationGuardResponse | null>(null);
    const [form] = Form.useForm<GuardFormValues>();
    const {t} = useTranslation();

    const fetchGuards = () => {
        setLoading(true);
        locationAPI
                .findAllLocationGuards()
                .then((res) => setGuards(res))
                .catch(() => message.error(t("LocationGuards.messages.fetchError")))
                .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchGuards();
    }, []);

    const openCreate = () => {
        setEditing(null);
        form.resetFields();
        form.setFieldsValue({
            guard_type: GuardTypeEnum.CIRCLE,
            primary_coordinate: undefined as unknown as GeoCoordinate,
            secondary_coordinate: null,
            radius: undefined,
        });
        setModalOpen(true);
    };

    const openEdit = (rec: LocationGuardResponse) => {
        setEditing(rec);
        form.resetFields();
        form.setFieldsValue({
            guard_type: rec.guard_type,
            primary_coordinate: rec.primary_coordinate,
            secondary_coordinate: rec.secondary_coordinate ?? null,
            radius: rec.radius ?? null,
        });
        setModalOpen(true);
    };

    const handleDelete = (rec: LocationGuardResponse) => {
        locationAPI
                .deleteLocationGuard(rec.id)
                .then(() => {
                    message.success(t("LocationGuards.messages.deleteSuccess"));
                    fetchGuards();
                })
                .catch(() => message.error(t("LocationGuards.messages.deleteError")));
    };

    const guardType = Form.useWatch("guard_type", form);

    const onSubmit = () => {
        form
                .validateFields()
                .then((values) => {
                    setSubmitting(true);
                    const primary = LocationAPI.roundCoord(values.primary_coordinate)!;
                    const secondary =
                            values.guard_type === GuardTypeEnum.SQUARE ? LocationAPI.roundCoord(values.secondary_coordinate ?? null) : null;

                    const payload: LocationGuardRequest = {
                        id: editing?.id ?? null,
                        guard_type: values.guard_type,
                        primary_coordinate: primary,
                        ...(values.guard_type === GuardTypeEnum.SQUARE
                                ? {secondary_coordinate: secondary, radius: null}
                                : {radius: values.radius ?? null, secondary_coordinate: null}),
                    };

                    const req = editing ? locationAPI.updateLocationGuard(payload) : locationAPI.addLocationGuard(payload);
                    req.then(() => {
                        message.success(editing ? t("LocationGuards.messages.updateSuccess") : t("LocationGuards.messages.createSuccess"));
                        setModalOpen(false);
                        fetchGuards();
                    })
                            .catch(() => message.error(editing ? t("LocationGuards.messages.updateError") : t("LocationGuards.messages.createError")))
                            .finally(() => setSubmitting(false));
                })
                .catch(() => void 0);
    };

    const columns: ColumnsType<LocationGuardResponse> = [
        {
            title: t("LocationGuards.columns.id.title"),
            dataIndex: "id",
            key: "id",
            width: 90,
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: t("LocationGuards.columns.guard_type.title"),
            dataIndex: "guard_type",
            key: "guard_type",
            render: (v: LocationGuardResponse["guard_type"]) => typeTag(v),
            width: 120,
            filters: [
                {text: GuardTypeEnum.CIRCLE, value: GuardTypeEnum.CIRCLE},
                {text: GuardTypeEnum.SQUARE, value: GuardTypeEnum.SQUARE},
            ],
            onFilter: (val, rec) => rec.guard_type === val,
        },
        {
            title: t("LocationGuards.columns.primary.title"),
            key: "primary",
            render: (_: unknown, rec) => formatCoord(rec.primary_coordinate),
        },
        {
            title: t("LocationGuards.columns.secondary.title"),
            key: "secondary",
            render: (_: unknown, rec) => formatCoord(rec.secondary_coordinate),
        },
        {
            title: t("LocationGuards.columns.radius.title"),
            dataIndex: "radius",
            key: "radius",
            render: (v?: number | null) => (v ? `${v}` : "—"),
            sorter: (a, b) => (a.radius ?? 0) - (b.radius ?? 0),
            width: 140,
        },
        {
            title: t("LocationGuards.columns.actions.title"),
            key: "actions",
            width: 220,
            render: (_: unknown, rec) => (
                    <Space>
                        <Button onClick={() => openEdit(rec)}>{t("LocationGuards.actions.edit")}</Button>
                        <Popconfirm
                                title={t("LocationGuards.popconfirm.delete.title")}
                                description={t("LocationGuards.popconfirm.delete.description")}
                                okText={t("Common.popconfirm.yes")}
                                cancelText={t("Common.popconfirm.no")}
                                onConfirm={() => handleDelete(rec)}
                        >
                            <Button danger>{t("LocationGuards.actions.delete")}</Button>
                        </Popconfirm>
                    </Space>
            ),
        },
    ];

    return (
            <Space vertical={true} style={{width: "100%", padding: 24}} size="large">
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={3} style={{margin: 0}}>
                            {t("LocationGuards.header.title")}
                        </Title>
                    </Col>
                    <Col>
                        <Button type="primary" onClick={openCreate}>
                            {t("LocationGuards.actions.new")}
                        </Button>
                    </Col>
                </Row>

                <Table<LocationGuardResponse>
                        columns={columns}
                        dataSource={guards.map((g) => ({...g, key: g.id}))}
                        loading={loading}
                        pagination={{pageSize: 10, showSizeChanger: true, pageSizeOptions: ["10", "20", "50"]}}
                        scroll={{x: "max-content"}}
                        rowKey="id"
                />

                <Modal
                        title={editing ? t("LocationGuards.modal.edit.title") : t("LocationGuards.modal.create.title")}
                        open={modalOpen}
                        onCancel={() => setModalOpen(false)}
                        onOk={onSubmit}
                        confirmLoading={submitting}
                        width={900}
                        destroyOnClose
                        maskClosable
                >
                    <Form<GuardFormValues> form={form} layout="vertical">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                        name="guard_type"
                                        label={t("LocationGuards.modal.guard_type.label")}
                                        rules={[{required: true, message: t("LocationGuards.modal.guard_type.validation.required")}]}
                                        initialValue={GuardTypeEnum.CIRCLE}
                                >
                                    <Select
                                            options={[
                                                {label: GuardTypeEnum.CIRCLE, value: GuardTypeEnum.CIRCLE},
                                                {label: GuardTypeEnum.SQUARE, value: GuardTypeEnum.SQUARE},
                                            ]}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider>{t("LocationGuards.modal.primary.title")}</Divider>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                        name={["primary_coordinate", "latitude"]}
                                        label={t("LocationGuards.modal.latitude.label")}
                                        rules={[{required: true, message: t("LocationGuards.modal.latitude.validation.required")}]}
                                >
                                    <InputNumber
                                            style={{width: "100%"}}
                                            placeholder={t("LocationGuards.modal.latitude.placeholder")}
                                            min={-90}
                                            max={90}
                                            step={0.00001}
                                            precision={5}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                        name={["primary_coordinate", "longitude"]}
                                        label={t("LocationGuards.modal.longitude.label")}
                                        rules={[{required: true, message: t("LocationGuards.modal.longitude.validation.required")}]}
                                >
                                    <InputNumber
                                            style={{width: "100%"}}
                                            placeholder={t("LocationGuards.modal.longitude.placeholder")}
                                            min={-180}
                                            max={180}
                                            step={0.00001}
                                            precision={5}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8} style={{display: "flex", alignItems: "end"}}>
                                <Button
                                        onClick={() => {
                                            const coord = form.getFieldValue("primary_coordinate") as GeoCoordinate | undefined;
                                            if (!coord || typeof coord.latitude !== "number" || typeof coord.longitude !== "number") {
                                                message.info(t("LocationGuards.messages.mapClickInfo"));
                                            } else {
                                                form.setFieldsValue({primary_coordinate: LocationAPI.roundCoord(coord) as GeoCoordinate});
                                            }
                                        }}
                                >
                                    {t("LocationGuards.modal.buttons.useMap")}
                                </Button>
                            </Col>
                        </Row>
                        <MapPicker
                                value={form.getFieldValue("primary_coordinate")}
                                onChange={(c) => form.setFieldsValue({primary_coordinate: LocationAPI.roundCoord(c)!})}
                                height={220}
                                active={modalOpen}
                        />

                        {guardType === GuardTypeEnum.SQUARE ? (
                                <>
                                    <Divider>{t("LocationGuards.modal.secondary.title")}</Divider>
                                    <Row gutter={16}>
                                        <Col span={8}>
                                            <Form.Item
                                                    name={["secondary_coordinate", "latitude"]}
                                                    label={t("LocationGuards.modal.latitude.label")}
                                                    rules={
                                                        guardType === GuardTypeEnum.SQUARE
                                                                ? [{required: true, message: t("LocationGuards.modal.latitude.validation.required")}]
                                                                : undefined
                                                    }
                                            >
                                                <InputNumber
                                                        style={{width: "100%"}}
                                                        placeholder={t("LocationGuards.modal.latitude.placeholder")}
                                                        min={-90}
                                                        max={90}
                                                        step={0.00001}
                                                        precision={5}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                    name={["secondary_coordinate", "longitude"]}
                                                    label={t("LocationGuards.modal.longitude.label")}
                                                    rules={
                                                        guardType === GuardTypeEnum.SQUARE
                                                                ? [{required: true, message: t("LocationGuards.modal.longitude.validation.required")}]
                                                                : undefined
                                                    }
                                            >
                                                <InputNumber
                                                        style={{width: "100%"}}
                                                        placeholder={t("LocationGuards.modal.longitude.placeholder")}
                                                        min={-180}
                                                        max={180}
                                                        step={0.00001}
                                                        precision={5}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8} style={{display: "flex", alignItems: "end"}}>
                                            <Button
                                                    onClick={() => {
                                                        const coord = form.getFieldValue("secondary_coordinate") as GeoCoordinate | undefined;
                                                        if (!coord || typeof coord.latitude !== "number" || typeof coord.longitude !== "number") {
                                                            message.info(t("LocationGuards.messages.mapClickInfo"));
                                                        } else {
                                                            form.setFieldsValue({secondary_coordinate: LocationAPI.roundCoord(coord) as GeoCoordinate});
                                                        }
                                                    }}
                                            >
                                                {t("LocationGuards.modal.buttons.useMap")}
                                            </Button>
                                        </Col>
                                    </Row>
                                    <MapPicker
                                            value={form.getFieldValue("secondary_coordinate")}
                                            onChange={(c) => form.setFieldsValue({secondary_coordinate: LocationAPI.roundCoord(c)!})}
                                            height={220}
                                            active={modalOpen}
                                    />
                                </>
                        ) : (
                                <>
                                    <Divider>{t("LocationGuards.modal.circle.title")}</Divider>
                                    <Row gutter={16}>
                                        <Col span={8}>
                                            <Form.Item
                                                    name="radius"
                                                    label={t("LocationGuards.modal.radius.label")}
                                                    rules={
                                                        guardType === GuardTypeEnum.CIRCLE
                                                                ? [
                                                                    {required: true, message: t("LocationGuards.modal.radius.validation.required")},
                                                                    {type: "number", min: 1, message: t("LocationGuards.modal.radius.validation.min")},
                                                                ]
                                                                : undefined
                                                    }
                                            >
                                                <InputNumber
                                                        style={{width: "100%"}}
                                                        placeholder={t("LocationGuards.modal.radius.placeholder")}
                                                        min={1}
                                                        step={1}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={16} style={{display: "flex", alignItems: "center"}}>
                                            <Text type="secondary">
                                                {t("LocationGuards.modal.circle.helper")}
                                            </Text>
                                        </Col>
                                    </Row>
                                </>
                        )}
                    </Form>
                </Modal>
            </Space>
    );
}
