import { Circle, Eraser, Hand, Minus, PaintBucket, PencilSimple, Selection, Square } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { BrushTool, DottingRef, useBrush } from 'dotting';
import React, { useContext, useEffect, useState } from 'react';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import { FontEditorCommands } from '../../FontEditor/FontEditorCommands';
import { PixelEditorTool } from './PixelEditorTool';

interface PixelEditorToolsProps {
    dottingRef: React.RefObject<DottingRef>
}

export default function PixelEditorTools(props: PixelEditorToolsProps): React.JSX.Element {
    const { services, enableCommands } = useContext(EditorsContext) as EditorsContextType;
    const { dottingRef } = props;
    const { brushTool, changeBrushTool } = useBrush(dottingRef);
    const [previousBrushTool, setPreviousBrushTool] = useState<BrushTool>(BrushTool.NONE);

    const onKeyDown = (e: KeyboardEvent): void => {
        if (!e.repeat && e.code === 'Space') {
            setPreviousBrushTool(brushTool);
            changeBrushTool(BrushTool.NONE);
        }
    };

    const onKeyUp = (e: KeyboardEvent): void => {
        if (!e.repeat && e.code === 'Space') {
            changeBrushTool(previousBrushTool);
        }
    };

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case FontEditorCommands.TOOL_DRAG.id:
                changeBrushTool(BrushTool.NONE);
                break;
            case FontEditorCommands.TOOL_ERASER.id:
                changeBrushTool(BrushTool.ERASER);
                break;
            case FontEditorCommands.TOOL_MARQUEE.id:
                changeBrushTool(BrushTool.SELECT);
                break;
            case FontEditorCommands.TOOL_PAINT_BUCKET.id:
                changeBrushTool(BrushTool.PAINT_BUCKET);
                break;
            case FontEditorCommands.TOOL_PENCIL.id:
                changeBrushTool(BrushTool.DOT);
                break;
            case FontEditorCommands.TOOL_LINE.id:
                changeBrushTool(BrushTool.LINE);
                break;
            case FontEditorCommands.TOOL_RECTANGLE.id:
                // changeBrushTool(BrushTool.RECTANGLE);
                break;
            case FontEditorCommands.TOOL_ELLIPSE.id:
                // changeBrushTool(BrushTool.ELLIPSE);
                break;
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
        };
    }, [brushTool]);

    useEffect(() => {
        enableCommands([
            ...Object.values(FontEditorCommands).map(c => c.id)
        ]);
    }, []);

    useEffect(() => {
        document.addEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        return () => {
            document.removeEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        };
    }, []);

    return (
        <VContainer>
            <label>
                {nls.localize('vuengine/editors/font/tools/title', 'Tools')}
            </label>
            <HContainer gap={2} wrap='wrap'>
                <PixelEditorTool
                    className={brushTool === BrushTool.NONE ? 'active' : ''}
                    title={
                        nls.localize('vuengine/editors/font/tools/drag', 'Drag') +
                        services.vesCommonService.getKeybindingLabel(FontEditorCommands.TOOL_DRAG.id, true)
                    }
                    onClick={() => changeBrushTool(BrushTool.NONE)}
                >
                    <Hand size={20} />
                </PixelEditorTool>
                <PixelEditorTool
                    className={`tool ${brushTool === BrushTool.SELECT ? 'active' : undefined}`}
                    title={
                        nls.localize('vuengine/editors/font/tools/marquee', 'Marquee') +
                        services.vesCommonService.getKeybindingLabel(FontEditorCommands.TOOL_MARQUEE.id, true)
                    }
                    onClick={() => changeBrushTool(BrushTool.SELECT)}
                >
                    <Selection size={20} />
                </PixelEditorTool>
                <PixelEditorTool
                    className={brushTool === BrushTool.DOT ? 'active' : ''}
                    title={
                        nls.localize('vuengine/editors/font/tools/pencil', 'Pencil') +
                        services.vesCommonService.getKeybindingLabel(FontEditorCommands.TOOL_PENCIL.id, true)
                    }
                    onClick={() => changeBrushTool(BrushTool.DOT)}
                >
                    <PencilSimple size={20} />
                </PixelEditorTool>
                <PixelEditorTool
                    className={brushTool === BrushTool.LINE ? 'active' : ''}
                    title={
                        nls.localize('vuengine/editors/font/tools/line', 'Line') +
                        services.vesCommonService.getKeybindingLabel(FontEditorCommands.TOOL_LINE.id, true)
                    }
                    onClick={() => changeBrushTool(BrushTool.LINE)}
                >
                    <Minus size={20} />
                </PixelEditorTool>
                <PixelEditorTool
                    // className={brushTool === BrushTool.RECTANGLE ? 'active' : ''}
                    title={
                        nls.localize('vuengine/editors/font/tools/rectangle', 'Rectangle') +
                        services.vesCommonService.getKeybindingLabel(FontEditorCommands.TOOL_RECTANGLE.id, true)
                    }
                // onClick={() => changeBrushTool(BrushTool.RECTANGLE)}
                >
                    <Square size={20} />
                </PixelEditorTool>
                <PixelEditorTool
                    // className={brushTool === BrushTool.RECTANGLE_FILLED ? 'active' : ''}
                    title={
                        nls.localize('vuengine/editors/font/tools/rectangleFilled', 'Rectangle (Filled)') +
                        services.vesCommonService.getKeybindingLabel(FontEditorCommands.TOOL_RECTANGLE_FILLED.id, true)
                    }
                // onClick={() => changeBrushTool(BrushTool.RECTANGLE_FILLED)}
                >
                    <Square size={20} weight="fill" />
                </PixelEditorTool>
                <PixelEditorTool
                    // className={brushTool === BrushTool.ELLIPSE ? 'active' : ''}
                    title={
                        nls.localize('vuengine/editors/font/tools/ellipse', 'Ellipse') +
                        services.vesCommonService.getKeybindingLabel(FontEditorCommands.TOOL_ELLIPSE.id, true)
                    }
                // onClick={() => changeBrushTool(BrushTool.ELLIPSE)}
                >
                    <Circle size={20} />
                </PixelEditorTool>
                <PixelEditorTool
                    // className={brushTool === BrushTool.ELLIPSE_FILLED ? 'active' : ''}
                    title={
                        nls.localize('vuengine/editors/font/tools/ellipseFilled', 'Ellipse (Filled)') +
                        services.vesCommonService.getKeybindingLabel(FontEditorCommands.TOOL_ELLIPSE_FILLED.id, true)
                    }
                // onClick={() => changeBrushTool(BrushTool.ELLIPSE_FILLED)}
                >
                    <Circle size={20} weight="fill" />
                </PixelEditorTool>
                <PixelEditorTool
                    className={brushTool === BrushTool.PAINT_BUCKET ? 'active' : ''}
                    title={
                        nls.localize('vuengine/editors/font/tools/paintBucket', 'Paint Bucket') +
                        services.vesCommonService.getKeybindingLabel(FontEditorCommands.TOOL_PAINT_BUCKET.id, true)
                    }
                    onClick={() => changeBrushTool(BrushTool.PAINT_BUCKET)}
                >
                    <PaintBucket size={20} />
                </PixelEditorTool>
                <PixelEditorTool
                    className={brushTool === BrushTool.ERASER ? 'active' : ''}
                    title={
                        nls.localize('vuengine/editors/font/tools/eraser', 'Eraser') +
                        services.vesCommonService.getKeybindingLabel(FontEditorCommands.TOOL_ERASER.id, true)
                    }
                    onClick={() => changeBrushTool(BrushTool.ERASER)}
                >
                    <Eraser size={20} />
                </PixelEditorTool>
            </HContainer>
        </VContainer>
    );
}
