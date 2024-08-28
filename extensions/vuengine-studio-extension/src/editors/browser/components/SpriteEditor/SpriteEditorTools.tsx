import { Eraser, Hand, PaintBucket, PencilSimple, Selection } from '@phosphor-icons/react';
import { BrushTool, DottingRef, useBrush } from 'dotting';
import React, { useEffect, useState } from 'react';
import HContainer from '../Common/HContainer';
import { SpriteEditorTool } from './SpriteEditorTool';

interface SpriteEditorToolsProps {
    dottingRef: React.RefObject<DottingRef>
}

export default function SpriteEditorTools(props: SpriteEditorToolsProps): React.JSX.Element {
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

    useEffect(() => {
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
        };
    }, [brushTool]);

    return (
        <HContainer gap={2} wrap='wrap'>
            <SpriteEditorTool
                className={brushTool === BrushTool.NONE ? 'active' : ''}
                onClick={() => changeBrushTool(BrushTool.NONE)}
            >
                <Hand size={20} />
            </SpriteEditorTool>
            <SpriteEditorTool
                className={brushTool === BrushTool.DOT ? 'active' : ''}
                onClick={() => changeBrushTool(BrushTool.DOT)}
            >
                <PencilSimple size={20} />
            </SpriteEditorTool>
            <SpriteEditorTool
                className={brushTool === BrushTool.ERASER ? 'active' : ''}
                onClick={() => changeBrushTool(BrushTool.ERASER)}
            >
                <Eraser size={20} />
            </SpriteEditorTool>
            <SpriteEditorTool
                className={brushTool === BrushTool.PAINT_BUCKET ? 'active' : ''}
                onClick={() => changeBrushTool(BrushTool.PAINT_BUCKET)}
            >
                <PaintBucket size={20} />
            </SpriteEditorTool>
            {/*
                <SpriteEditorTool
                    className={brushTool === BrushTool.STROKE ? 'active' : ''}
                    onClick={() => changeBrushTool(BrushTool.STROKE)}
                >
                    <PencilSimpleLine size={20} />
                </SpriteEditorTool>
                <SpriteEditorTool
                    className={brushTool === BrushTool.SQUARE ? 'active' : ''}
                    onClick={() => changeBrushTool(BrushTool.SQUARE)}
                >
                    <Square size={20} />
                </SpriteEditorTool>
                <SpriteEditorTool
                    className={brushTool === BrushTool.CIRCLE ? 'active' : ''}
                    onClick={() => changeBrushTool(BrushTool.CIRCLE)}
                >
                    <Circle size={20} />
                </SpriteEditorTool>
            */}
            <SpriteEditorTool
                className={`tool ${brushTool === BrushTool.SELECT ? 'active' : undefined}`}
                onClick={() => changeBrushTool(BrushTool.SELECT)}
            >
                <Selection size={20} />
            </SpriteEditorTool>
        </HContainer>
    );
}
