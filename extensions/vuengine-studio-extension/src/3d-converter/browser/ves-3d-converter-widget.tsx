import { nls } from '@theia/core';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import * as PIXI from 'pixi.js';
import { Stage, withFilters, Container, Sprite } from '@inlet/react-pixi';

export interface ves3dConverterWidgetState {
};

@injectable()
export class Ves3dConverterWidget extends ReactWidget {
    static readonly ID = 'ves3dConverterWidget';
    static readonly LABEL = nls.localize('vuengine/3dConverter/3dConverter', '3D Converter');

    protected state: ves3dConverterWidgetState;

    protected converterLogLineLastElementRef = React.createRef<HTMLDivElement>();

    @postConstruct()
    protected async init(): Promise<void> {
        this.id = Ves3dConverterWidget.ID;
        this.title.iconClass = 'codicon codicon-color-mode';
        this.title.closable = true;
        this.title.label = Ves3dConverterWidget.LABEL;
        this.title.caption = Ves3dConverterWidget.LABEL;
        this.node.tabIndex = 0; // required for this.node.focus() to work in this.onActivateRequest()
        this.update();
    }

    protected render(): React.ReactNode {
        const width = 384;
        const height = 224;

        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

        const Filters = withFilters(Container, {
            displacement: PIXI.filters.DisplacementFilter
        });

        const displacementConfig = {
            x: 1,
            y: 1
        };

        return (
            <Stage width={width} height={height}>
                <Sprite
                    {...displacementConfig}
                    image="https://pixijs.io/examples/examples/assets/pixi-filters/displacement_map_repeat.jpg"
                // ref={displacementSpriteRef}
                />
                <Filters
                    displacement={{
                        // scale: { x: 30, y: 60 }
                    }}
                />
                <Sprite
                    anchor={0.5}
                    scale={5}
                    x={width / 2}
                    y={height / 2}
                    image="https://s3-us-west-2.amazonaws.com/s.cdpn.io/693612/IaUrttj.png"
                />

            </Stage>
        );
    }
}
