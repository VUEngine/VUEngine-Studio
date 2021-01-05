import { VesProperty } from "../common/types";
import { homedir } from "os";

export const VesProjectsBaseFolderPreference: VesProperty = {
    id: "projects.baseFolder",
    property: {
        type: "string",
        description: "Base folder for new projects.",
        default: homedir()
    },
};

export const VesProjectsMakerCodePreference: VesProperty = {
    id: "projects.makerCode",
    property: {
        type: "string",
        minLength: 2,
        maxLength: 2,
        description: "Default Maker Code to place in ROM header of new projects",
        default: "VS",
    },
};