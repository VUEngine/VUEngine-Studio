import { BrushTool, DottingRef, useBrush } from 'dotting';
import React, { useContext } from 'react';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import CanvasImage from '../../Common/CanvasImage';
import { DisplayMode } from '../../Common/VUEngineTypes';
import { DOT_BRUSH_PATTERNS } from '../PixelEditorTypes';
import { PixelEditorTool } from './PixelEditorTool';

interface PixelEditorCurrentToolSettingsProps {
    dottingRef: React.RefObject<DottingRef>
}

export default function PixelEditorCurrentToolSettings(props: PixelEditorCurrentToolSettingsProps): React.JSX.Element {
    const { dottingRef } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { brushTool, brushPattern, changeBrushPattern } = useBrush(dottingRef);

    const textColor = services.colorRegistry.getCurrentColor('editor.foreground') ?? '#000';

    return (
        [BrushTool.DOT, BrushTool.ERASER].includes(brushTool) ?
            <HContainer gap={2} wrap='wrap'>
                {DOT_BRUSH_PATTERNS.map((p, i) => (
                    <PixelEditorTool
                        key={i}
                        className={(brushPattern.length === 1 && i === 0) || (p.length === brushPattern.length && p.every((value, index) => value === brushPattern[index]))
                            ? 'active' : ''}
                        onClick={() => changeBrushPattern(p)}
                    >
                        <CanvasImage
                            height={p.length}
                            palette={'00000000'}
                            pixelData={[p]}
                            style={{ zoom: 3 }}
                            textColor={textColor}
                            width={p.length}
                            displayMode={DisplayMode.Mono}
                            colorMode={ColorMode.Default}
                        />
                    </PixelEditorTool>
                ))}
            </HContainer>
            : <></>
    );
}
