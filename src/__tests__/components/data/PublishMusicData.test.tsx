import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {message} from "antd";
import {PublishMusicData} from "../../../components/data/PublishMusicData";
import {dataAPI} from "../../../services";

const trackTask = jest.fn();

jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: (key: string) => key})
}));

jest.mock("@vempain/vempain-common-frontend", () => ({
    useTaskProgress: () => ({trackTask})
}));

jest.mock("../../../services", () => ({
    dataAPI: {publishMusic: jest.fn()}
}));

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: () => ({matches: false, addListener: jest.fn(), removeListener: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn()})
});

const publishMusic = jest.mocked(dataAPI.publishMusic);

describe("PublishMusicData", () => {
    beforeEach(() => {
        publishMusic.mockReset();
        trackTask.mockReset();
        jest.spyOn(message, "success").mockImplementation(() => ({}) as never);
        jest.spyOn(message, "error").mockImplementation(() => ({}) as never);
    });

    afterEach(() => jest.restoreAllMocks());

    it("starts the music data set task and hands it to the tray", async () => {
        const accepted = {task_id: "t-1", type: "PUBLISH_MUSIC_DATA", title: "Publish music", status: "QUEUED", total_steps: 3};
        publishMusic.mockResolvedValue(accepted as never);
        render(<PublishMusicData/>);

        fireEvent.click(screen.getByRole("button", {name: "PublishMusicData.actions.publish"}));

        await waitFor(() => expect(trackTask).toHaveBeenCalledWith(accepted));
        expect(message.success).toHaveBeenCalledWith("PublishMusicData.messages.publishStarted");
        expect(screen.getByText("PublishMusicData.header.title")).toBeTruthy();
    });

    it("reports a failed start", async () => {
        publishMusic.mockRejectedValue(new Error("down"));
        render(<PublishMusicData/>);

        fireEvent.click(screen.getByRole("button", {name: "PublishMusicData.actions.publish"}));

        await waitFor(() => expect(message.error).toHaveBeenCalledWith("PublishMusicData.messages.publishError"));
        expect(trackTask).not.toHaveBeenCalled();
    });
});
