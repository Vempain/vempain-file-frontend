import {useTranslation} from "react-i18next";

export function Home() {
    const {t} = useTranslation();
    return (
            <div className={"DarkDiv"}>
                <h1>{t("Home.title")}</h1>
            </div>
    );
}
