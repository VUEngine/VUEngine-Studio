import { MonacoThemingService } from '@theia/monaco/lib/browser/monaco-theming-service';

MonacoThemingService.register({
    label: "Light (VUEngine Studio)",
    id: "vuengine-light",
    uiTheme: "vs",
    json: require("../../../src/browser/themes/vuengine-light-color-theme.json")
});

MonacoThemingService.register({
    label: "Dark (VUEngine Studio)",
    id: "vuengine-dark",
    uiTheme: "vs-dark",
    json: require("../../../src/browser/themes/vuengine-dark-color-theme.json")
});