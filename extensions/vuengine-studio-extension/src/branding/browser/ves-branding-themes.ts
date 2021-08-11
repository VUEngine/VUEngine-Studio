import { MonacoThemingService } from '@theia/monaco/lib/browser/monaco-theming-service';

MonacoThemingService.register({
    label: 'Light (VUEngine Studio)',
    id: 'light', // override theia id
    uiTheme: 'vs',
    json: require('../../../src/branding/browser/themes/vuengine-light-color-theme.json')
});

MonacoThemingService.register({
    label: 'Dark (VUEngine Studio)',
    id: 'dark', // override theia id
    uiTheme: 'vs-dark',
    json: require('../../../src/branding/browser/themes/vuengine-dark-color-theme.json')
});

MonacoThemingService.register({
    label: 'High Contrast (VUEngine Studio)',
    id: 'hc-theia', // override theia id
    uiTheme: 'hc-black',
    json: require('../../../src/branding/browser/themes/vuengine-high-contrast-color-theme.json')
});

MonacoThemingService.register({
    label: 'Virtual Boy',
    id: 'virtual-boy',
    uiTheme: 'hc-black',
    json: require('../../../src/branding/browser/themes/vuengine-virtual-boy-color-theme.json')
});
