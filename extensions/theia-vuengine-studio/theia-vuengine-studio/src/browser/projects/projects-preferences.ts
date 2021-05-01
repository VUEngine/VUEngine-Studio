import { VesProperty } from "../common/common-types";
import { homedir } from "os";

export namespace VesProjectsPrefs {
    export const BASE_FOLDER: VesProperty = {
        id: "projects.baseFolder",
        property: {
            type: "string",
            description: "Base folder for new projects.",
            default: homedir()
        },
    };

    export const MAKER_CODE: VesProperty = {
        id: "projects.makerCode",
        property: {
            type: "string",
            minLength: 2,
            maxLength: 2,
            description: "Default Maker Code to place in ROM header of new projects.",
            default: "VS",
        },
    };
};