import { MonacoThemingService } from '@theia/monaco/lib/browser/monaco-theming-service';

MonacoThemingService.register({
    label: "Light (default)",
    id: "vuengine-light",
    uiTheme: "vs",
    json: require("../../../src/browser/themes/vuengine-light-color-theme.json")
});

MonacoThemingService.register({
    label: "Dark (default)",
    id: "vuengine-dark",
    uiTheme: "vs-dark",
    json: require("../../../src/browser/themes/vuengine-dark-color-theme.json")
});

MonacoThemingService.register({
    label: "High Contrast (default)",
    id: "vuengine-hc",
    uiTheme: "hc-black",
    json: require("../../../src/browser/themes/vuengine-high-contrast-color-theme.json")
});

MonacoThemingService.register({
    label: "Virtual Boy",
    id: "vuengine-vb",
    uiTheme: "hc-black",
    json: require("../../../src/browser/themes/vuengine-virtual-boy-color-theme.json")
});
