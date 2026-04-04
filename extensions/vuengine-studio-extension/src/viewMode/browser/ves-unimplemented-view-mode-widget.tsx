import { Warning } from '@phosphor-icons/react';
import { Message } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import EmptyContainer from '../../editors/browser/components/Common/EmptyContainer';

@injectable()
export class UnimplementedViewModeWidget extends ReactWidget {
    static readonly ID = 'unimplementedViewModeWidget';
    static readonly LABEL = 'Empty';

    @postConstruct()
    protected init(): void {
        this.id = UnimplementedViewModeWidget.ID;
        this.title.label = UnimplementedViewModeWidget.LABEL;
        this.title.caption = UnimplementedViewModeWidget.LABEL;
        this.title.iconClass = 'codicon codicon-warning';
        this.title.closable = false;

        this.update();
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.node.tabIndex = 0;
        this.node.focus();
    }

    protected render(): React.ReactNode {
        return (
            <EmptyContainer
                title='Not Yet Implemented'
                description='This view mode has not yet been implemented'
                icon={<Warning size={32} />}
            />
        );
    }
}
