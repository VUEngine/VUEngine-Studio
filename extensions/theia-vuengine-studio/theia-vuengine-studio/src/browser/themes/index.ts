import { MonacoThemingService } from '@theia/monaco/lib/browser/monaco-theming-service';

MonacoThemingService.register({
    label: 'Light',
    id: 'light', // override theia id
    uiTheme: 'vs',
    json: require('../../../src/browser/themes/vuengine-light-color-theme.json')
});

MonacoThemingService.register({
    label: 'Dark',
    id: 'dark', // override theia id
    uiTheme: 'vs-dark',
    json: require('../../../src/browser/themes/vuengine-dark-color-theme.json')
});

MonacoThemingService.register({
    label: 'High Contrast',
    id: 'hc-theia', // override theia id
    uiTheme: 'hc-black',
    json: require('../../../src/browser/themes/vuengine-high-contrast-color-theme.json')
});

MonacoThemingService.register({
    label: 'Virtual Boy',
    id: 'virtual-boy',
    uiTheme: 'hc-black',
    json: require('../../../src/browser/themes/vuengine-virtual-boy-color-theme.json')
});
