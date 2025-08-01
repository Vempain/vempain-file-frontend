import {Button, Drawer, Grid, Layout, Menu, type MenuProps, Tooltip} from "antd";
import {useState} from "react";
import {
    AppstoreOutlined,
    AudioOutlined,
    ClockCircleOutlined,
    FieldTimeOutlined,
    FileImageOutlined,
    FileOutlined,
    FileSearchOutlined,
    FileUnknownOutlined,
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
import {useSession} from "../../../vempain-frontend-auth/src/session";

const {Header} = Layout;
const {useBreakpoint} = Grid;

export function TopBar() {
    const [current, setCurrent] = useState("mail");
    const {userSession} = useSession();

    const screens = useBreakpoint();
    const [drawerOpen, setDrawerOpen] = useState(false);

    type MenuItem = Required<MenuProps>["items"][number];

    const menuBarItems: MenuItem[] = [
        ...(userSession && [{
                    label: "Tag management",
                    key: "tagManagement",
                    icon: <SnippetsOutlined/>,
                    children: [
                        {
                            label: (<NavLink to={"/tags/list"}>Tags</NavLink>),
                            key: "tagList",
                            icon: <FormOutlined/>
                        },
                        {
                            label: (<NavLink to={"/tags/create"}>New tag</NavLink>),
                            key: "tagCreate",
                            icon: <FormOutlined/>
                        },
                        {
                            label: (<NavLink to={"/tags/search"}>Page</NavLink>),
                            key: "tagSearch",
                            icon: <SearchOutlined/>
                        }
                    ]
                },
                    {
                        label: "File Management",
                        key: "fileManagement",
                        icon: <FileOutlined/>,
                        children: [
                            {
                                label: (<NavLink to={"/files/audios"}>Audio</NavLink>),
                                key: "audioFiles",
                                icon: <AudioOutlined/>
                            },
                            {
                                label: (<NavLink to={"/files/documents"}>Document</NavLink>),
                                key: "documentFiles",
                                icon: <FileUnknownOutlined/>
                            },
                            {
                                label: (<NavLink to={"/files/images"}>Image</NavLink>),
                                key: "imageFiles",
                                icon: <FileImageOutlined/>
                            },
                            {
                                label: (<NavLink to={"/files/videos"}>Video</NavLink>),
                                key: "videoFiles",
                                icon: <VideoCameraOutlined/>
                            },
                            {
                                label: (<NavLink to={"/files/import"}>Import files</NavLink>),
                                key: "importFiles",
                                icon: <ImportOutlined/>
                            },
                            {
                                label: (<NavLink to={"/files/search"}>Search files</NavLink>),
                                key: "searchFiles",
                                icon: <FileSearchOutlined/>
                            },
                        ],
                    },
                    {
                        label: "Schedule Management",
                        key: "scheduleManagement",
                        icon: <ClockCircleOutlined/>,
                        children: [
                            {
                                label: (<NavLink to={"/schedules/system"}>System schedules</NavLink>),
                                key: "systemSchedules",
                                icon: <AppstoreOutlined/>
                            },
                            {
                                label: (<NavLink to={"/schedules/file-imports"}>File imports</NavLink>),
                                key: "fileImports",
                                icon: <UploadOutlined/>
                            },
                            {
                                label: (<NavLink to={"/schedules/publishing"}>Publishing</NavLink>),
                                key: "publishing",
                                icon: <FieldTimeOutlined/>
                            },
                        ],
                    },
                    {
                        label: "User Management",
                        key: "userManagement",
                        icon: <UserOutlined/>,
                        children: [
                            {
                                label: (<NavLink to={"/management/users"}>Users</NavLink>),
                                key: "users",
                                icon: <UserAddOutlined/>
                            },
                            {
                                label: (<NavLink to={"/management/units"}>Units</NavLink>),
                                key: "units",
                                icon: <UsergroupAddOutlined/>
                            },
                        ],
                    },
                    {
                        label: "Profile",
                        key: "profile",
                        icon: <InfoCircleOutlined/>,
                        children: [
                            {
                                label: (<NavLink to={"/user/account"}>Account</NavLink>),
                                key: "account",
                                icon: <SettingFilled/>
                            },
                            {
                                label: (<NavLink to={"/user/password"}>Change password</NavLink>),
                                key: "changePassword",
                                icon: <SwapOutlined/>
                            },
                            {
                                label: (<NavLink to={"/user/logout"}>Log out</NavLink>),
                                key: "logout",
                                icon: <LogoutOutlined/>
                            }
                        ]
                    }] ||
                [
                    {
                        label: (<NavLink to="/login" type={"button"}>Login</NavLink>),
                        key: "user-login",
                        icon: <LoginOutlined/>
                    },
                    {
                        label: (<NavLink to="/auth/register">Register</NavLink>),
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
            >
                {/* Logo + (desktop) menu */}
                <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            flex: 1,
                            overflow: "hidden"
                        }}
                >
                    <Tooltip title={"Vempain File"}>
                        <div style={{width: 156, height: 64, marginRight: 20}}>
                            <NavLink to={"/"}>
                                <img
                                        src="/logo192.png"
                                        alt="Home"
                                        style={{height: "50px", objectFit: "contain"}}/>
                            </NavLink>
                        </div>
                    </Tooltip>

                    {/* show horizontal Menu only on ≥ md */}
                    {screens.md && (
                            <Menu
                                    onClick={onClick}
                                    selectedKeys={[current]}
                                    mode="horizontal"
                                    items={menuBarItems}
                                    style={{width: "100%"}}
                            />
                    )}
                </div>

                {/* Hamburger button – hidden on desktop */}
                {!screens.md && (
                        <>
                            <Button
                                    type="text"
                                    icon={<MenuOutlined style={{fontSize: 24}}/>}
                                    onClick={() => setDrawerOpen(true)}
                                    aria-label="Open menu"
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
