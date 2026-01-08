import { Circle, Eraser, Hand, Minus, PaintBucket, PencilSimple, Selection, Square } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { BrushTool, DottingRef, useBrush } from 'dotting';
import React, { useContext, useEffect, useState } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import { PixelEditorCommands } from '../PixelEditorCommands';
import { DOT_BRUSH_PATTERNS } from '../PixelEditorTypes';
import { PixelEditorTool } from './PixelEditorTool';

interface PixelEditorToolsProps {
    dottingRef: React.RefObject<DottingRef>
}

export default function PixelEditorTools(props: PixelEditorToolsProps): React.JSX.Element {
    const { services, onCommandExecute } = useContext(EditorsContext) as EditorsContextType;
    const { dottingRef } = props;
    const { brushTool, changeBrushTool, changeBrushPattern } = useBrush(dottingRef);
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

    const commandListener = (commandId: string): void => {
        switch (commandId) {
            case PixelEditorCommands.TOOL_DRAG.id:
                changeBrushTool(BrushTool.NONE);
                break;
            case PixelEditorCommands.TOOL_ERASER.id:
                changeBrushTool(BrushTool.ERASER);
                break;
            case PixelEditorCommands.TOOL_MARQUEE.id:
                changeBrushTool(BrushTool.SELECT);
                break;
            case PixelEditorCommands.TOOL_PAINT_BUCKET.id:
                changeBrushTool(BrushTool.PAINT_BUCKET);
                break;
            case PixelEditorCommands.TOOL_PENCIL.id:
                changeBrushTool(BrushTool.DOT);
                break;
            case PixelEditorCommands.TOOL_LINE.id:
                changeBrushTool(BrushTool.LINE);
                changeBrushPattern(DOT_BRUSH_PATTERNS[0]);
                break;
            case PixelEditorCommands.TOOL_RECTANGLE.id:
                changeBrushTool(BrushTool.RECTANGLE);
                changeBrushPattern(DOT_BRUSH_PATTERNS[0]);
                break;
            case PixelEditorCommands.TOOL_RECTANGLE_FILLED.id:
                changeBrushTool(BrushTool.RECTANGLE_FILLED);
                changeBrushPattern(DOT_BRUSH_PATTERNS[0]);
                break;
            case PixelEditorCommands.TOOL_ELLIPSE.id:
                changeBrushTool(BrushTool.ELLIPSE);
                changeBrushPattern(DOT_BRUSH_PATTERNS[0]);
                break;
            case PixelEditorCommands.TOOL_ELLIPSE_FILLED.id:
                changeBrushTool(BrushTool.ELLIPSE_FILLED);
                changeBrushPattern(DOT_BRUSH_PATTERNS[0]);
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
        const disp = onCommandExecute(commandListener);
        return () => disp.dispose();
    }, []);

    return (
        <VContainer>
            <label>
                {nls.localize('vuengine/editors/pixel/tools/title', 'Tools')}
            </label>
            <HContainer gap={2} wrap='wrap'>
                <PixelEditorTool
                    className={brushTool === BrushTool.NONE ? 'active' : ''}
                    title={
                        nls.localize('vuengine/editors/pixel/tools/drag', 'Drag') +
                        services.vesCommonService.getKeybindingLabel(PixelEditorCommands.TOOL_DRAG.id, true)
                    }
                    onClick={() => changeBrushTool(BrushTool.NONE)}
                >
                    <Hand size={20} />
                </PixelEditorTool>
                <PixelEditorTool
                    className={`tool ${brushTool === BrushTool.SELECT ? 'active' : undefined}`}
                    title={
                        nls.localize('vuengine/editors/pixel/tools/marquee', 'Marquee') +
                        services.vesCommonService.getKeybindingLabel(PixelEditorCommands.TOOL_MARQUEE.id, true)
                    }
                    onClick={() => changeBrushTool(BrushTool.SELECT)}
                >
                    <Selection size={20} />
                </PixelEditorTool>
                <PixelEditorTool
                    className={brushTool === BrushTool.DOT ? 'active' : ''}
                    title={
                        nls.localize('vuengine/editors/pixel/tools/pencil', 'Pencil') +
                        services.vesCommonService.getKeybindingLabel(PixelEditorCommands.TOOL_PENCIL.id, true)
                    }
                    onClick={() => changeBrushTool(BrushTool.DOT)}
                >
                    <PencilSimple size={20} />
                </PixelEditorTool>
                <PixelEditorTool
                    className={brushTool === BrushTool.LINE ? 'active' : ''}
                    title={
                        nls.localize('vuengine/editors/pixel/tools/line', 'Line') +
                        services.vesCommonService.getKeybindingLabel(PixelEditorCommands.TOOL_LINE.id, true)
                    }
                    onClick={() => {
                        changeBrushTool(BrushTool.LINE);
                        changeBrushPattern(DOT_BRUSH_PATTERNS[0]);
                    }}
                >
                    <Minus size={20} />
                </PixelEditorTool>
                <PixelEditorTool
                    className={brushTool === BrushTool.RECTANGLE ? 'active' : ''}
                    title={
                        nls.localize('vuengine/editors/pixel/tools/rectangle', 'Rectangle') +
                        services.vesCommonService.getKeybindingLabel(PixelEditorCommands.TOOL_RECTANGLE.id, true)
                    }
                    onClick={() => {
                        changeBrushTool(BrushTool.RECTANGLE);
                        changeBrushPattern(DOT_BRUSH_PATTERNS[0]);
                    }}
                >
                    <Square size={20} />
                </PixelEditorTool>
                <PixelEditorTool
                    className={brushTool === BrushTool.RECTANGLE_FILLED ? 'active' : ''}
                    title={
                        nls.localize('vuengine/editors/pixel/tools/rectangleFilled', 'Rectangle (Filled)') +
                        services.vesCommonService.getKeybindingLabel(PixelEditorCommands.TOOL_RECTANGLE_FILLED.id, true)
                    }
                    onClick={() => {
                        changeBrushTool(BrushTool.RECTANGLE_FILLED);
                        changeBrushPattern(DOT_BRUSH_PATTERNS[0]);
                    }}
                >
                    <Square size={20} weight="fill" />
                </PixelEditorTool>
                <PixelEditorTool
                    className={brushTool === BrushTool.ELLIPSE ? 'active' : ''}
                    title={
                        nls.localize('vuengine/editors/pixel/tools/ellipse', 'Ellipse') +
                        services.vesCommonService.getKeybindingLabel(PixelEditorCommands.TOOL_ELLIPSE.id, true)
                    }
                    onClick={() => {
                        changeBrushTool(BrushTool.ELLIPSE);
                        changeBrushPattern(DOT_BRUSH_PATTERNS[0]);
                    }}
                >
                    <Circle size={20} />
                </PixelEditorTool>
                <PixelEditorTool
                    className={brushTool === BrushTool.ELLIPSE_FILLED ? 'active' : ''}
                    title={
                        nls.localize('vuengine/editors/pixel/tools/ellipseFilled', 'Ellipse (Filled)') +
                        services.vesCommonService.getKeybindingLabel(PixelEditorCommands.TOOL_ELLIPSE_FILLED.id, true)
                    }
                    onClick={() => {
                        changeBrushTool(BrushTool.ELLIPSE_FILLED);
                        changeBrushPattern(DOT_BRUSH_PATTERNS[0]);
                    }}
                >
                    <Circle size={20} weight="fill" />
                </PixelEditorTool>
                <PixelEditorTool
                    className={brushTool === BrushTool.PAINT_BUCKET ? 'active' : ''}
                    title={
                        nls.localize('vuengine/editors/pixel/tools/paintBucket', 'Paint Bucket') +
                        services.vesCommonService.getKeybindingLabel(PixelEditorCommands.TOOL_PAINT_BUCKET.id, true)
                    }
                    onClick={() => changeBrushTool(BrushTool.PAINT_BUCKET)}
                >
                    <PaintBucket size={20} />
                </PixelEditorTool>
                <PixelEditorTool
                    className={brushTool === BrushTool.ERASER ? 'active' : ''}
                    title={
                        nls.localize('vuengine/editors/pixel/tools/eraser', 'Eraser') +
                        services.vesCommonService.getKeybindingLabel(PixelEditorCommands.TOOL_ERASER.id, true)
                    }
                    onClick={() => changeBrushTool(BrushTool.ERASER)}
                >
                    <Eraser size={20} />
                </PixelEditorTool>
            </HContainer>
        </VContainer>
    );
}
