import { injectable } from '@theia/core/shared/inversify';
import { MonacoThemeRegistry } from '@theia/monaco/lib/browser/textmate/monaco-theme-registry';

@injectable()
export class VesThemeRegistry extends MonacoThemeRegistry {
    initializeDefaultThemes(): void {
        this.register({
            ...require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/dark_theia.json'),
            ...require('../../../themes/vuengine-dark-color-theme.json'),
        }, {
            './dark_vs.json': require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/dark_vs.json'),
            './dark_plus.json': require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/dark_plus.json')
        }, 'dark-vuengine', 'vs-dark');

        this.register({
            ...require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/light_theia.json'),
            ...require('../../../themes/vuengine-light-color-theme.json'),
        }, {
            './light_vs.json': require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/light_vs.json'),
            './light_plus.json': require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/light_plus.json')
        }, 'light-vuengine', 'vs');

        this.register({
            ...require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/hc_theia.json'),
            ...require('../../../themes/vuengine-hc-dark-color-theme.json'),
        }, {
            './hc_black.json': require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/hc_black.json')
        }, 'hc-vuengine', 'hc-black');

        this.register({
            ...require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/hc_theia_light.json'),
            ...require('../../../themes/vuengine-hc-light-color-theme.json'),
        }, {
            './hc_light.json': require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/hc_light.json')
        }, 'hc-vuengine-light', 'hc-light');

        // This theme is implemented through a filter in style/virtual-boy-theme.css
        this.register({
            ...require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/hc_theia.json'),
            ...require('../../../themes/vuengine-hc-dark-color-theme.json'),
        }, {
            './hc_black.json': require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/hc_black.json')
        }, 'hc-virtual-boy', 'hc-black');
    }
}
