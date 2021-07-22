import * as React from 'react';
import { inject, injectable, postConstruct } from 'inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { ColorRegistry } from '@theia/core/lib/browser/color-registry';
import { ThemeService } from '@theia/core/lib/browser/theming';

@injectable()
export class VesDocumentationIFrameWidget extends ReactWidget {
    @inject(ColorRegistry) private readonly colorRegistry: ColorRegistry;
    @inject(ThemeService) private readonly themeService: ThemeService;

    static readonly ID = 'ves-webview-title';
    static readonly LABEL = 'Hardware Documentation';

    @postConstruct()
    protected async init(): Promise<void> {
        this.id = VesDocumentationIFrameWidget.ID;
        this.title.label = VesDocumentationIFrameWidget.LABEL;
        this.title.caption = VesDocumentationIFrameWidget.LABEL;
        this.title.iconClass = 'fa fa-book';
        this.title.closable = true;
        this.themeService.onThemeChange(() => setTimeout(() => { this.injectCssVariables() }, 1));
        // TODO: hook into electron rerender as well
        this.update();
    }

    protected render(): React.ReactNode {
        return <iframe id='vesWebview' src={this.getResoure()} onLoad={() => this.injectCssVariables()}> </iframe>;
    }

    protected getResoure(): string {
        return 'https://files.virtual-boy.com/download/978651/stsvb.html';
    }

    protected injectCssVariables(): void {

        let themeVars = '';

        for (const id of this.colorRegistry.getColors()) {
            const variable = this.colorRegistry.getCurrentCssVariable(id);
            if (variable) {
                themeVars += `${variable.name}:${variable.value};`;
            }
        }

        // @ts-ignore
        document.getElementById('vesWebview').contentWindow.document.getElementsByTagName('HTML')[0].style = themeVars;
    }
}
