import { BrushTool, DottingRef, useBrush } from 'dotting';
import React, { useState } from 'react';
import { ColorMode } from '../../../../core/browser/ves-common-types';
import CanvasImage from '../Common/CanvasImage';
import HContainer from '../Common/HContainer';
import { DisplayMode } from '../Common/VUEngineTypes';
import { SpriteEditorTool } from './SpriteEditorTool';
import { DOT_BRUSH_PATTERNS } from './SpriteEditorTypes';

interface SpriteEditorCurrentToolSettingsProps {
    dottingRef: React.RefObject<DottingRef>
}

export default function SpriteEditorCurrentToolSettings(props: SpriteEditorCurrentToolSettingsProps): React.JSX.Element {
    const { dottingRef } = props;
    const { brushTool, changeBrushPattern } = useBrush(dottingRef);
    const [dotBrushPattern, setDotBrushPattern] = useState<number>(0);

    return (
        [BrushTool.DOT, BrushTool.ERASER].includes(brushTool) ?
            <HContainer gap={2} wrap='wrap'>
                {DOT_BRUSH_PATTERNS.map((p, i) => (
                    <SpriteEditorTool
                        key={i}
                        className={dotBrushPattern === i ? 'active' : ''}
                        onClick={() => {
                            setDotBrushPattern(i);
                            changeBrushPattern(p);
                        }}
                    >
                        <CanvasImage
                            height={p.length}
                            palette={'00000000'}
                            pixelData={[p]}
                            style={{ zoom: 3 }}
                            useTextColor
                            width={p.length}
                            displayMode={DisplayMode.Mono}
                            colorMode={ColorMode.Default}
                        />
                    </SpriteEditorTool>
                ))}
            </HContainer>
            : <></>
    );
}
