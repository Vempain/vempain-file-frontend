import {LanguageTool} from "../../tools/languageTool";

describe("LanguageTool", () => {
    it("lists Finnish, English and Swedish", () => {
        expect(LanguageTool.getLanguages().map(language => language.value)).toEqual(["fi", "en", "sv"]);
    });

    it("resolves the label of a known language", () => {
        expect(LanguageTool.getLabelByValue("en")).toBe("English 🇬🇧");
        expect(LanguageTool.getLabelByValue("sv")).toBe("Svenska 🇸🇪");
    });

    it("falls back to the language picker label for an unknown language", () => {
        expect(LanguageTool.getLabelByValue("de")).toBe("Valitse kieli 🌐");
    });
});
