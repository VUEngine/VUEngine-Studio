export interface VesCoreAPI {
    setZoomFactor(zoomFactor: number): void;
    getUserDefault(preference: string, type: string): string;
}

declare global {
    interface Window {
        electronVesCore: VesCoreAPI
    }
}

export const VES_CHANNEL_SET_ZOOM_FACTOR = 'setZoomFactor';
export const VES_CHANNEL_GET_USER_DEFAULT = 'getUserDefault';
