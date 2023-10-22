import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { Theme } from '@theia/core/lib/common/theme';

@injectable()
export class VesThemeService extends ThemeService {
    @postConstruct()
    protected init(): void {
        super.init();

        this.themes = {};
        this.register(...VesBuiltinThemeProvider.themes);
        this.loadUserTheme();
    }
}

export class VesBuiltinThemeProvider {
    static readonly darkTheme: Theme = {
        id: 'Dark',
        type: 'dark',
        label: 'Dark',
        editorTheme: 'dark-vuengine',
    };
    static readonly lightTheme: Theme = {
        id: 'Light',
        type: 'light',
        label: 'Light',
        editorTheme: 'light-vuengine',
    };
    static readonly darkHcTheme: Theme = {
        id: 'High Contrast Dark',
        type: 'hc',
        label: 'High Contrast Dark',
        editorTheme: 'hc-vuengine',
    };
    static readonly lightHcTheme: Theme = {
        id: 'High Contrast Light',
        type: 'hcLight',
        label: 'High Contrast Light',
        editorTheme: 'hc-vuengine-light',
    };
    static readonly vbTheme: Theme = {
        id: 'Virtual Boy',
        type: 'hc',
        label: 'Virtual Boy',
        editorTheme: 'hc-virtual-boy',
    };
    static readonly themes = [
        VesBuiltinThemeProvider.darkTheme,
        VesBuiltinThemeProvider.lightTheme,
        VesBuiltinThemeProvider.darkHcTheme,
        VesBuiltinThemeProvider.lightHcTheme,
        VesBuiltinThemeProvider.vbTheme,
    ];
}
