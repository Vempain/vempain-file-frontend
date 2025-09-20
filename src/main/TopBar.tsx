import {Button, Drawer, Grid, Layout, Menu, type MenuProps, Tooltip} from "antd";
import {useState} from "react";
import {
    AppstoreOutlined,
    ArrowsAltOutlined,
    AudioOutlined,
    ClockCircleOutlined,
    FieldTimeOutlined,
    FileImageOutlined,
    FileOutlined,
    FileSearchOutlined,
    FileUnknownOutlined,
    FileZipOutlined,
    FormOutlined,
    ImportOutlined,
    InfoCircleOutlined,
    LoginOutlined,
    LogoutOutlined,
    MenuOutlined,
    SearchOutlined,
    SettingFilled,
    SnippetsOutlined,
    SwapOutlined,
    UploadOutlined,
    UserAddOutlined,
    UsergroupAddOutlined,
    UserOutlined,
    VideoCameraOutlined
} from "@ant-design/icons";
import {NavLink} from "react-router-dom";
import {useSession} from "@vempain/vempain-auth-frontend";
import {useTranslation} from "react-i18next";

const {Header} = Layout;
const {useBreakpoint} = Grid;

export function TopBar() {
    const [current, setCurrent] = useState("mail");
    const {userSession} = useSession();
    const {t} = useTranslation();

    const screens = useBreakpoint();
    const [drawerOpen, setDrawerOpen] = useState(false);

    type MenuItem = Required<MenuProps>["items"][number];

    const menuBarItems: MenuItem[] = [
        ...(userSession && [{
                    label: t("TopBar.menu.tagManagement.title"),
                    key: "tagManagement",
                    icon: <SnippetsOutlined/>,
                    children: [
                        {
                            label: (<NavLink to={"/tags/list"}>{t("TopBar.menu.tagManagement.tags")}</NavLink>),
                            key: "tag-tagList",
                            icon: <FormOutlined/>
                        },
                        {
                            label: (<NavLink to={"/tags/create"}>{t("TopBar.menu.tagManagement.newTag")}</NavLink>),
                            key: "tag-tagCreate",
                            icon: <FormOutlined/>
                        },
                        {
                            label: (<NavLink to={"/tags/search"}>{t("TopBar.menu.tagManagement.search")}</NavLink>),
                            key: "tag-tagSearch",
                            icon: <SearchOutlined/>
                        }
                    ]
                },
                    {
                        label: t("TopBar.menu.fileManagement.title"),
                        key: "fileManagement",
                        icon: <FileOutlined/>,
                        children: [
                            {
                                label: (<NavLink to={"/files/archives"}>{t("TopBar.menu.fileManagement.archive")}</NavLink>),
                                key: "file-archiveFiles",
                                icon: <FileZipOutlined/>
                            },
                            {
                                label: (<NavLink to={"/files/audios"}>{t("TopBar.menu.fileManagement.audio")}</NavLink>),
                                key: "file-audioFiles",
                                icon: <AudioOutlined/>
                            },
                            {
                                label: (<NavLink to={"/files/documents"}>{t("TopBar.menu.fileManagement.document")}</NavLink>),
                                key: "file-documentFiles",
                                icon: <FileUnknownOutlined/>
                            },
                            {
                                label: (<NavLink to={"/files/images"}>{t("TopBar.menu.fileManagement.image")}</NavLink>),
                                key: "file-imageFiles",
                                icon: <FileImageOutlined/>
                            },
                            {
                                label: (<NavLink to={"/files/vectors"}>{t("TopBar.menu.fileManagement.vector")}</NavLink>),
                                key: "file-vectorFiles",
                                icon: <ArrowsAltOutlined/>
                            },
                            {
                                label: (<NavLink to={"/files/videos"}>{t("TopBar.menu.fileManagement.video")}</NavLink>),
                                key: "file-videoFiles",
                                icon: <VideoCameraOutlined/>
                            },
                            {
                                label: (<NavLink to={"/files/import"}>{t("TopBar.menu.fileManagement.importFiles")}</NavLink>),
                                key: "file-importFiles",
                                icon: <ImportOutlined/>
                            },
                            {
                                label: (<NavLink to={"/files/search"}>{t("TopBar.menu.fileManagement.searchFiles")}</NavLink>),
                                key: "file-searchFiles",
                                icon: <FileSearchOutlined/>
                            },
                        ],
                    },
                    {
                        label: t("TopBar.menu.publishing.title"),
                        key: "publishingManagement",
                        icon: <ClockCircleOutlined/>,
                        children: [
                            {
                                label: (<NavLink to={"/publish/file-group"}>{t("TopBar.menu.publishing.fileGroup")}</NavLink>),
                                key: "publishing-publishFileGroup",
                                icon: <AppstoreOutlined/>
                            }
                        ],
                    },
                    {
                        label: t("TopBar.menu.schedules.title"),
                        key: "scheduleManagement",
                        icon: <ClockCircleOutlined/>,
                        children: [
                            {
                                label: (<NavLink to={"/schedules/system"}>{t("TopBar.menu.schedules.systemSchedules")}</NavLink>),
                                key: "schedule-systemSchedules",
                                icon: <AppstoreOutlined/>
                            },
                            {
                                label: (<NavLink to={"/schedules/file-imports"}>{t("TopBar.menu.schedules.fileImports")}</NavLink>),
                                key: "schedule-fileImports",
                                icon: <UploadOutlined/>
                            },
                            {
                                label: (<NavLink to={"/schedules/publishing"}>{t("TopBar.menu.schedules.publishing")}</NavLink>),
                                key: "schedule-publishing",
                                icon: <FieldTimeOutlined/>
                            },
                        ],
                    },
                    {
                        label: t("TopBar.menu.userManagement.title"),
                        key: "userManagement",
                        icon: <UserOutlined/>,
                        children: [
                            {
                                label: (<NavLink to={"/management/users"}>{t("TopBar.menu.userManagement.users")}</NavLink>),
                                key: "user-users",
                                icon: <UserAddOutlined/>
                            },
                            {
                                label: (<NavLink to={"/management/units"}>{t("TopBar.menu.userManagement.units")}</NavLink>),
                                key: "user-units",
                                icon: <UsergroupAddOutlined/>
                            },
                        ],
                    },
                    {
                        label: t("TopBar.menu.profile.title"),
                        key: "profile",
                        icon: <InfoCircleOutlined/>,
                        children: [
                            {
                                label: (<NavLink to={"/user/account"}>{t("TopBar.menu.profile.account")}</NavLink>),
                                key: "profile-account",
                                icon: <SettingFilled/>
                            },
                            {
                                label: (<NavLink to={"/user/password"}>{t("TopBar.menu.profile.changePassword")}</NavLink>),
                                key: "profile-changePassword",
                                icon: <SwapOutlined/>
                            },
                            {
                                label: (<NavLink to={"/user/logout"}>{t("TopBar.menu.profile.logout")}</NavLink>),
                                key: "profile-logout",
                                icon: <LogoutOutlined/>
                            }
                        ]
                    }] ||
                [
                    {
                        label: (<NavLink to="/login" type={"button"}>{t("TopBar.menu.auth.login")}</NavLink>),
                        key: "user-login",
                        icon: <LoginOutlined/>
                    },
                    {
                        label: (<NavLink to="/auth/register">{t("TopBar.menu.auth.register")}</NavLink>),
                        key: "user-register",
                        icon: <FormOutlined/>
                    }
                ])
    ];

    const onClick: MenuProps["onClick"] = (e) => {
        setCurrent(e.key);
    };

    return (
            <Header
                    className="topbar-header"
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 16px",
                        backgroundColor: "#191919",
                        maxWidth: "100%"
                    }}
                    key={"topBarHeader"}
            >
                <div style={{display: "flex", alignItems: "center", flex: 1, overflow: "hidden"}}>
                    <Tooltip title={t("TopBar.tooltip.brand")}>
                        <div style={{width: 60, height: 60, marginRight: 20}}>
                            <NavLink to={"/"}>
                                <img src="/logo192.png" alt={t("TopBar.brand.homeAlt")} style={{height: "55px", objectFit: "contain"}}/>
                            </NavLink>
                        </div>
                    </Tooltip>

                    {screens.md && (
                            <Menu
                                    className="topbar-menu"
                                    onClick={onClick}
                                    selectedKeys={[current]}
                                    mode="horizontal"
                                    items={menuBarItems}
                                    style={{width: "100%"}}
                            />
                    )}
                </div>

                {!screens.md && (
                        <>
                            <Button
                                    type="text"
                                    icon={<MenuOutlined style={{fontSize: 24}}/>}
                                    onClick={() => setDrawerOpen(true)}
                                    aria-label={t("TopBar.a11y.openMenu")}
                            />
                            <Drawer
                                    placement="right"
                                    onClose={() => setDrawerOpen(false)}
                                    open={drawerOpen}
                                    styles={{body: {padding: "0"}}}
                                    width={260}
                            >
                                <Menu
                                        onClick={onClick}
                                        selectedKeys={[current]}
                                        mode="inline"
                                        items={menuBarItems}
                                        style={{border: "none"}}
                                />
                            </Drawer>
                        </>
                )}
            </Header>
    );

}
