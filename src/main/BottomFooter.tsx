import {Footer} from "antd/es/layout/layout";
import type {BuildInfo} from "../models";
import BuildInfoData from "../buildInfo.json";
import {useTranslation} from "react-i18next";

export function BottomFooter() {
    const buildInfo: BuildInfo = BuildInfoData;
    const {t} = useTranslation();

    return (
            <Footer style={{textAlign: "center"}}
                    dangerouslySetInnerHTML={{
                        __html: import.meta.env.VITE_APP_VEMPAIN_COPYRIGHT_FOOTER + "<br/>"
                                + t("BottomFooter.text.versionPrefix") + buildInfo.version + " "
                                + t("BottomFooter.text.builtPrefix") + " " + buildInfo.buildTime + "<br/>"
                                + import.meta.env.VITE_APP_POWERED_BY_VEMPAIN
                    }}/>
    );
}
