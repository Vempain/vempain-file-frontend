import {Button, Flex, Layout, Menu, type MenuProps} from "antd";
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
    LogoutOutlined,
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
import {Link} from "react-router-dom";
import {useSession} from "../../../vempain-frontend-auth/src/session";

const {Header} = Layout;

function TopBar() {
    const [current, setCurrent] = useState("mail");
    const {userSession} = useSession();

    const mainMenuItems: MenuProps["items"] = [
        {
            label: "Tag management",
            key: "tagManagement",
            icon: <SnippetsOutlined/>,
            children: [
                {
                    label: (<Link to={"/tags/list"}>Tag editing</Link>),
                    key: "tagList",
                    icon: <FormOutlined/>
                },
                {
                    label: (<Link to={"/tags/create"}>New tag</Link>),
                    key: "tagCreate",
                    icon: <FormOutlined/>
                },
                {
                    label: (<Link to={"/tags/search"}>Page</Link>),
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
                    label: (<Link to={"/files/audios"}>Audio</Link>),
                    key: "audioFiles",
                    icon: <AudioOutlined/>
                },
                {
                    label: (<Link to={"/files/documents"}>Document</Link>),
                    key: "documentFiles",
                    icon: <FileUnknownOutlined/>
                },
                {
                    label: (<Link to={"/files/images"}>Image</Link>),
                    key: "imageFiles",
                    icon: <FileImageOutlined/>
                },
                {
                    label: (<Link to={"/files/videos"}>Video</Link>),
                    key: "videoFiles",
                    icon: <VideoCameraOutlined/>
                },
                {
                    label: (<Link to={"/files/import"}>Add files</Link>),
                    key: "importFiles",
                    icon: <ImportOutlined/>
                },
                {
                    label: (<Link to={"/files/search"}>Search files</Link>),
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
                    label: (<Link to={"/schedules/system"}>System schedules</Link>),
                    key: "systemSchedules",
                    icon: <AppstoreOutlined/>
                },
                {
                    label: (<Link to={"/schedules/file-imports"}>File imports</Link>),
                    key: "fileImports",
                    icon: <UploadOutlined/>
                },
                {
                    label: (<Link to={"/schedules/publishing"}>Publishing</Link>),
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
                    label: (<Link to={"/management/users"}>Users</Link>),
                    key: "users",
                    icon: <UserAddOutlined/>
                },
                {
                    label: (<Link to={"/management/units"}>Units</Link>),
                    key: "units",
                    icon: <UsergroupAddOutlined/>
                },
            ],
        },
    ];

    const userMenuItems: MenuProps["items"] = [
        {
            label: "Profile",
            key: "profile",
            icon: <InfoCircleOutlined/>,
            children: [
                {
                    label: (<Link to={"/user/account"}>Account</Link>),
                    key: "account",
                    icon: <SettingFilled/>
                },
                {
                    label: (<Link to={"/user/password"}>Change password</Link>),
                    key: "changePassword",
                    icon: <SwapOutlined/>
                },
                {
                    label: (<Link to={"/user/logout"}>Log out</Link>),
                    key: "logout",
                    icon: <LogoutOutlined/>
                }
            ]
        }
    ];

    const onClick: MenuProps["onClick"] = (e) => {
        setCurrent(e.key);
    };

    return (
            <Header style={{display: "flex", alignItems: "center"}} key={"topBarHeader"}>
                <div className="demo-logo" key={"mainBarLogoDiv"}>
                    <Link to={"/"} key={"topBarHomeLink"}>Home</Link>
                </div>
                {userSession && <Flex gap={"middle"} vertical={false}>
                    <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" items={mainMenuItems} key={"mainMenu"}/>
                </Flex>}
                <div style={{marginLeft: "auto"}} key={"userMenuDiv"}>
                    {userSession ? (
                            <Menu mode={"horizontal"} items={userMenuItems} key={"userMenu"}/>
                    ) : (
                            <Button type={"text"} href={"/login"} key={"loginButton"}>
                                Login
                            </Button>
                    )}
                </div>
            </Header>
    );
}

export {TopBar};
