import { ThemeService } from '@theia/core/lib/browser/theming';

const dark = require('../../../src/browser/branding/style/variables-dark.useable.css');
const light = require('../../../src/browser/branding/style/variables-light.useable.css');

function updateTheme(): void {
    const theme = ThemeService.get().getCurrentTheme().id;
    if (theme === 'dark') {
        light.unuse();
        dark.use();
    } else if (theme === 'light') {
        dark.unuse();
        light.use();
    }
}

updateTheme();

ThemeService.get().onThemeChange(() => updateTheme());
