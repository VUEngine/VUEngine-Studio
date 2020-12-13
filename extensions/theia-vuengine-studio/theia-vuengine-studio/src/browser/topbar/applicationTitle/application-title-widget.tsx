import * as React from 'react';
import { injectable, postConstruct } from 'inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';

@injectable()
export class VesTopbarApplicationTitleWidget extends ReactWidget {

    static readonly ID = 'ves-topbar-application-title';
    static readonly LABEL = 'Topbar Action Buttons';

    @postConstruct()
    protected async init(): Promise<void> {
        this.id = VesTopbarApplicationTitleWidget.ID;
        this.title.label = VesTopbarApplicationTitleWidget.LABEL;
        this.title.caption = VesTopbarApplicationTitleWidget.LABEL;
        this.title.closable = false;
        this.update();
    }

    protected render(): React.ReactNode {
        const { applicationName } = FrontendApplicationConfigProvider.get();
        return <>
            [Current Project] — {applicationName}
        </>;
    }
}
