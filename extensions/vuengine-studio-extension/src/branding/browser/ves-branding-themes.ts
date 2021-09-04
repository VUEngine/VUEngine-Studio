import { MonacoThemingService } from '@theia/monaco/lib/browser/monaco-theming-service';

MonacoThemingService.register({
    id: 'light', // override theia id
    label: 'Light (VUEngine Studio)',
    uiTheme: 'vs',
    json: require('../../../src/branding/browser/themes/vuengine-light-color-theme.json'),
    includes: {
        './dark_theia.json': require('./../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/light_theia.json')
    }
});

MonacoThemingService.register({
    id: 'dark', // override theia id
    label: 'Dark (VUEngine Studio)',
    uiTheme: 'vs-dark',
    json: require('../../../src/branding/browser/themes/vuengine-dark-color-theme.json'),
    includes: {
        './dark_theia.json': require('./../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/dark_theia.json')
    }
});

MonacoThemingService.register({
    id: 'hc-theia', // override theia id
    label: 'High Contrast (VUEngine Studio)',
    uiTheme: 'hc-black',
    json: require('../../../src/branding/browser/themes/vuengine-high-contrast-color-theme.json'),
    includes: {
        './dark_theia.json': require('./../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/hc_theia.json')
    }
});

// this is implemented through a filter in style/virtual-boy-theme.css
MonacoThemingService.register({
    id: 'virtual-boy',
    label: 'Virtual Boy',
    uiTheme: 'hc-black',
    json: require('../../../src/branding/browser/themes/vuengine-virtual-boy-color-theme.json')
});
