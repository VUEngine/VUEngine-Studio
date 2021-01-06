import { VesProperty } from "../common/types";

export namespace VesZoomPreferences {
    export const ZOOM_FACTOR: VesProperty = {
        id: "window.zoomFactor",
        property: {
            type: "string",
            label: "Zoom Factor",
            description: "Adjust the zoom factor of the window.",
            enum: [
                "30%",
                "50%",
                "66%",
                "80%",
                "90%",
                "100%",
                "110%",
                "120%",
                "133%",
                "150%",
                "170%",
                "200%",
                "240%",
                "300%",
            ],
            default: "100%",
        }
    }
};
