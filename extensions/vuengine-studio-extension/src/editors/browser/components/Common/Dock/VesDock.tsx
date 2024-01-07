import { DockLayout, DockPanel, Widget } from '@phosphor/widgets';
import React from 'react';
import { createPortal } from 'react-dom';

interface VesWidgetInfo {
    component: React.JSX.Element;
    node: HTMLElement;
}

interface VesDockState {
    widgetInfos: VesWidgetInfo[];
}

interface VesDockProps {
    defaultLayout: DockLayout.ILayoutConfig
}

export class WrapperWidget extends Widget {
    component: React.JSX.Element;
    constructor(name: string, component: React.JSX.Element) {
        const node = document.createElement('div');
        super({ node });
        this.setFlag(Widget.Flag.DisallowLayout);
        this.title.label = name;
        this.component = component;
    }
}

export class VesDock extends React.PureComponent<VesDockProps, VesDockState> {
    elem: HTMLDivElement | null;
    dock: DockPanel;
    widgets: WrapperWidget[] = [];

    async componentDidMount(): Promise<void> {
        this.dock = new DockPanel({
            spacing: 26
        }/* this.context.store */);
        this.dock.restoreLayout(this.props.defaultLayout);
        Widget.attach(this.dock, this.elem as HTMLElement);

        this.dock.layoutModified.connect(() => {
            this.forceUpdate();
        });

        const widgets = this.dock.widgets();
        let result = widgets.next();
        while (result !== undefined) {
            this.widgets.push(result as WrapperWidget);
            result = widgets.next();
        }
    }

    render(): React.JSX.Element {
        return (
            <div className="vesDock" ref={c => this.elem = c}>
                {
                    this.widgets.map(widget =>
                        createPortal(widget.component, widget.node)
                    )
                }
            </div>
        );
    }
}
