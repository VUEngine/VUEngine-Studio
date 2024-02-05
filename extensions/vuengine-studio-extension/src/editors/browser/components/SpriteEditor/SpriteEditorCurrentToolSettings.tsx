import { BrushTool, DottingRef, useBrush } from 'dotting';
import React, { useState } from 'react';
import CssImage from '../Common/CssImage';
import HContainer from '../Common/HContainer';
import { DOT_BRUSH_PATTERNS } from './SpriteEditorTypes';

interface SpriteEditorCurrentToolSettingsProps {
    dottingRef: React.RefObject<DottingRef>
}

export default function SpriteEditorCurrentToolSettings(props: SpriteEditorCurrentToolSettingsProps): React.JSX.Element {
    const { dottingRef } = props;
    const { brushTool, changeBrushPattern } = useBrush(dottingRef);
    const [dotBrushPattern, setDotBrushPattern] = useState<number>(0);

    return (
        brushTool === BrushTool.DOT ?
            <HContainer gap={2} wrap='wrap'>
                {DOT_BRUSH_PATTERNS.map((p, i) => (
                    <div
                        className={`tool${dotBrushPattern === i ? ' active' : ''}`}
                        onClick={() => {
                            setDotBrushPattern(i);
                            changeBrushPattern(p);
                        }}
                    >
                        <CssImage
                            height={p.length}
                            palette={'00000000'}
                            pixelData={p}
                            style={{ zoom: 3 }}
                            useTextColor
                            width={p.length}
                        />
                    </div>
                ))}
            </HContainer>
            : <></>
    );
}
