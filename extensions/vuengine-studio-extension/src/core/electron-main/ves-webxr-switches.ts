import { app } from '@theia/electron/shared/electron';

if (process.platform === 'win32') {
    app.commandLine.appendSwitch('enable-features', 'WebXR,OpenXR');
    app.commandLine.appendSwitch('force-webxr-runtime', 'openxr');
}
