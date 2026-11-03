import type {SplitAction} from "@vempain/vempain-common-frontend";
import type {TFunction} from "i18next";

/** Keys of the two actions of the "create" split buttons: create only, or create and publish to the website as well */
export const CREATE_ACTION = "create";
export const CREATE_AND_PUBLISH_ACTION = "create-and-publish";

/** The actions of a data set screen's split button, labelled from the screen's translation prefix */
export function createActions(t: TFunction, prefix: string, createDefault: string, createAndPublishDefault: string): SplitAction[] {
    return [
        {key: CREATE_ACTION, label: t(prefix + ".actions.create", {defaultValue: createDefault})},
        {key: CREATE_AND_PUBLISH_ACTION, label: t(prefix + ".actions.createAndPublish", {defaultValue: createAndPublishDefault})},
    ];
}
