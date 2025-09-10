/* eslint-disable no-null/no-null */
import {
    ArrowDown, ArrowDownLeft, ArrowDownRight, ArrowLeft, ArrowRight, ArrowsOut, ArrowUp, ArrowUpLeft, ArrowUpRight, Circle, FileArrowDown, Trash
} from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import { DottingRef, useDotting, useGrids } from 'dotting';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import PopUpDialog from '../../Common/Base/PopUpDialog';
import VContainer from '../../Common/Base/VContainer';
import { convertLayerPixelDataToPixelModifyItem, convertToLayerProps } from '../PixelEditor';
import { INPUT_BLOCKING_COMMANDS, LayerPixelData } from '../PixelEditorTypes';
import { PixelEditorTool } from './PixelEditorTool';

const ResizeDirectionBox = styled.div`
    align-items: center;
    border: var(--theia-border-width) solid var(--theia-dropdown-border);
    border-radius: 2px;
    cursor: pointer;
    display: flex;
    height: 32px;
    justify-content: center;
    width: 32px;

    &:hover {
        border-color: var(--theia-focusBorder);
    }
`;

interface PixelEditorActionsProps {
    colorMode: ColorMode
    frames: LayerPixelData[][]
    setFrames: (frames: LayerPixelData[][]) => void
    currentFrame: number
    dottingRef: React.RefObject<DottingRef>
}

export default function PixelEditorActions(props: PixelEditorActionsProps): React.JSX.Element {
    const { colorMode, frames, setFrames, currentFrame, dottingRef } = props;
    const { clear, downloadImage, setData, setLayers } = useDotting(dottingRef);
    const { dimensions } = useGrids(dottingRef);
    const [resizeDialogOpen, setResizeDialogOpen] = useState<boolean>(false);
    const [resizeHeight, setResizeHeight] = useState<number>(0);
    const [resizeWidth, setResizeWidth] = useState<number>(0);
    const [resizeDirection, setResizeDirection] = useState<number>(5);

    const confirmClear = async (): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/editors/pixel/clear', 'Clear Current Layer'),
            msg: nls.localize('vuengine/editors/pixel/areYouSureYouWantToClear', 'Are you sure you want to clear the entire canvas?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            clear();
        }
    };

    const resize = () => {
        const addColumnsLeft = resizeWidth > dimensions.columnCount
            ? [3, 6, 9].includes(resizeDirection)
                ? resizeWidth - dimensions.columnCount
                : [2, 5, 8].includes(resizeDirection)
                    ? (resizeWidth - dimensions.columnCount) / 2
                    : 0
            : 0;
        const addColumnsRight = resizeWidth > dimensions.columnCount
            ? [1, 4, 7].includes(resizeDirection)
                ? resizeWidth - dimensions.columnCount
                : [2, 5, 8].includes(resizeDirection)
                    ? (resizeWidth - dimensions.columnCount) / 2
                    : 0
            : 0;
        const removeColumnsLeft = resizeWidth < dimensions.columnCount
            ? [3, 6, 9].includes(resizeDirection)
                ? dimensions.columnCount - resizeWidth
                : [2, 5, 8].includes(resizeDirection)
                    ? (dimensions.columnCount - resizeWidth) / 2
                    : 0
            : 0;
        const removeColumnsRight = resizeWidth < dimensions.columnCount
            ? [1, 4, 7].includes(resizeDirection)
                ? dimensions.columnCount - resizeWidth
                : [2, 5, 8].includes(resizeDirection)
                    ? (dimensions.columnCount - resizeWidth) / 2
                    : 0
            : 0;

        const addRowsTop = resizeHeight > dimensions.rowCount
            ? [7, 8, 9].includes(resizeDirection)
                ? resizeHeight - dimensions.rowCount
                : [4, 5, 6].includes(resizeDirection)
                    ? (resizeHeight - dimensions.rowCount) / 2
                    : 0
            : 0;
        const addRowsBottom = resizeHeight > dimensions.rowCount
            ? [1, 2, 3].includes(resizeDirection)
                ? resizeHeight - dimensions.rowCount
                : [4, 5, 6].includes(resizeDirection)
                    ? (resizeHeight - dimensions.rowCount) / 2
                    : 0
            : 0;
        const removeRowsTop = resizeHeight < dimensions.rowCount
            ? [7, 8, 9].includes(resizeDirection)
                ? dimensions.rowCount - resizeHeight
                : [4, 5, 6].includes(resizeDirection)
                    ? (dimensions.rowCount - resizeHeight) / 2
                    : 0
            : 0;
        const removeRowsBottom = resizeHeight < dimensions.rowCount
            ? [1, 2, 3].includes(resizeDirection)
                ? dimensions.rowCount - resizeHeight
                : [4, 5, 6].includes(resizeDirection)
                    ? (dimensions.rowCount - resizeHeight) / 2
                    : 0
            : 0;

        const updatedFrames = [...frames];

        if (addColumnsLeft || addColumnsRight || removeColumnsLeft || removeColumnsRight) {
            frames.forEach((frame, frameIndex) =>
                frame.forEach((layer, layerIndex) =>
                    layer.data.forEach((row, rowIndex) => {
                        if (addColumnsLeft) {
                            for (let i = 0; i < addColumnsLeft; i++) {
                                updatedFrames[frameIndex][layerIndex].data[rowIndex].unshift(null);
                            }
                        }
                        if (addColumnsRight) {
                            for (let i = 0; i < addColumnsRight; i++) {
                                updatedFrames[frameIndex][layerIndex].data[rowIndex].push(null);
                            }
                        }
                        if (removeColumnsLeft) {
                            for (let i = 0; i < removeColumnsLeft; i++) {
                                updatedFrames[frameIndex][layerIndex].data[rowIndex].shift();
                            }
                        }
                        if (removeColumnsRight) {
                            for (let i = 0; i < removeColumnsRight; i++) {
                                updatedFrames[frameIndex][layerIndex].data[rowIndex].pop();
                            }
                        }
                    })
                )
            );
        }

        if (addRowsTop || addRowsBottom || removeRowsTop || removeRowsBottom) {
            const emptyRow = [...Array(updatedFrames[0][0].data[0].length)].map(e => null);
            frames.forEach((frame, frameIndex) =>
                frame.forEach((layer, layerIndex) => {
                    if (addRowsTop) {
                        for (let i = 0; i < addRowsTop; i++) {
                            updatedFrames[frameIndex][layerIndex].data.unshift(emptyRow);
                        }
                    }
                    if (addRowsBottom) {
                        for (let i = 0; i < addRowsBottom; i++) {
                            updatedFrames[frameIndex][layerIndex].data.push(emptyRow);
                        }
                    }
                    if (removeRowsTop) {
                        for (let i = 0; i < removeRowsTop; i++) {
                            updatedFrames[frameIndex][layerIndex].data.shift();
                        }
                    }
                    if (removeRowsBottom) {
                        for (let i = 0; i < removeRowsBottom; i++) {
                            updatedFrames[frameIndex][layerIndex].data.pop();
                        }
                    }
                })
            );
        }

        setFrames(updatedFrames);
        setLayers(convertToLayerProps(frames[currentFrame], colorMode));
        setData(convertLayerPixelDataToPixelModifyItem(frames[currentFrame][0], colorMode));
    };

    useEffect(() => {
        setResizeHeight(dimensions.rowCount);
        setResizeWidth(dimensions.columnCount);
    }, [
        dimensions
    ]);

    return (
        <VContainer>
            <label>
                {nls.localize('vuengine/editors/pixel/actions/title', 'Actions')}
            </label>
            <HContainer gap={2} wrap='wrap'>
                { /* }
                <PixelEditorTool
                    title={nls.localize('vuengine/editors/pixel/actions/import', 'Import')}
                    onClick={() => setImportDialogOpen(true)}
                >
                    <FileArrowUp size={20} />
                </PixelEditorTool>
                { */ }
                <PixelEditorTool
                    title={nls.localizeByDefault('Export')}
                    onClick={() => downloadImage({
                        type: 'png',
                        isGridVisible: false,
                    })}
                >
                    <FileArrowDown size={20} />
                </PixelEditorTool>
                <PixelEditorTool
                    title={nls.localize('vuengine/editors/pixel/actions/clear', 'Clear Current Layer')}
                    onClick={confirmClear}
                >
                    <Trash size={20} />
                </PixelEditorTool>
                <PixelEditorTool
                    title={nls.localize('vuengine/editors/pixel/actions/resize', 'Resize Canvas')}
                    onClick={() => setResizeDialogOpen(true)}
                >
                    <ArrowsOut size={20} />
                </PixelEditorTool>
            </HContainer>
            {resizeDialogOpen &&
                <PopUpDialog
                    open={resizeDialogOpen}
                    onClose={() => setResizeDialogOpen(false)}
                    onOk={async () => {
                        setResizeDialogOpen(false);
                        resize();
                    }}
                    okLabel={nls.localize('vuengine/editors/pixel/actions/resize', 'Resize Canvas')}
                    title={nls.localize('vuengine/editors/pixel/actions/resize', 'Resize Canvas')}
                    cancelButton
                    width="230px"
                >
                    <HContainer gap={15}>
                        <VContainer gap={15}>
                            <Input
                                label={nls.localize('vuengine/general/width', 'Width')}
                                type="number"
                                value={resizeWidth}
                                setValue={v => setResizeWidth(v as number)}
                                min={8}
                                max={512}
                                step={8}
                                tabIndex={0}
                                width={80}
                                commands={INPUT_BLOCKING_COMMANDS}
                                autoFocus
                            />
                            <Input
                                label={nls.localize('vuengine/general/height', 'Height')}
                                type="number"
                                value={resizeHeight}
                                setValue={v => setResizeHeight(v as number)}
                                min={8}
                                max={colorMode === ColorMode.FrameBlend ? 256 : 512}
                                step={8}
                                width={80}
                                commands={INPUT_BLOCKING_COMMANDS}
                            />
                        </VContainer>
                        <VContainer>
                            <HContainer>
                                <ResizeDirectionBox onClick={() => setResizeDirection(1)}>
                                    {resizeDirection === 1 && <Circle size={16} />}
                                    {resizeDirection === 2 && <ArrowLeft size={16} />}
                                    {resizeDirection === 4 && <ArrowUp size={16} />}
                                    {resizeDirection === 5 && <ArrowUpLeft size={16} />}
                                </ResizeDirectionBox>
                                <ResizeDirectionBox onClick={() => setResizeDirection(2)}>
                                    {resizeDirection === 1 && <ArrowRight size={16} />}
                                    {resizeDirection === 2 && <Circle size={16} />}
                                    {resizeDirection === 3 && <ArrowLeft size={16} />}
                                    {resizeDirection === 4 && <ArrowUpRight size={16} />}
                                    {resizeDirection === 5 && <ArrowUp size={16} />}
                                    {resizeDirection === 6 && <ArrowUpLeft size={16} />}
                                </ResizeDirectionBox>
                                <ResizeDirectionBox onClick={() => setResizeDirection(3)}>
                                    {resizeDirection === 2 && <ArrowRight size={16} />}
                                    {resizeDirection === 3 && <Circle size={16} />}
                                    {resizeDirection === 5 && <ArrowUpRight size={16} />}
                                    {resizeDirection === 6 && <ArrowUp size={16} />}
                                </ResizeDirectionBox>
                            </HContainer>
                            <HContainer>
                                <ResizeDirectionBox onClick={() => setResizeDirection(4)}>
                                    {resizeDirection === 1 && <ArrowDown size={16} />}
                                    {resizeDirection === 2 && <ArrowDownLeft size={16} />}
                                    {resizeDirection === 4 && <Circle size={16} />}
                                    {resizeDirection === 5 && <ArrowLeft size={16} />}
                                    {resizeDirection === 7 && <ArrowUp size={16} />}
                                    {resizeDirection === 8 && <ArrowUpLeft size={16} />}
                                </ResizeDirectionBox>
                                <ResizeDirectionBox onClick={() => setResizeDirection(5)}>
                                    {resizeDirection === 1 && <ArrowDownRight size={16} />}
                                    {resizeDirection === 2 && <ArrowDown size={16} />}
                                    {resizeDirection === 3 && <ArrowDownLeft size={16} />}
                                    {resizeDirection === 4 && <ArrowRight size={16} />}
                                    {resizeDirection === 5 && <Circle size={16} />}
                                    {resizeDirection === 6 && <ArrowLeft size={16} />}
                                    {resizeDirection === 7 && <ArrowUpRight size={16} />}
                                    {resizeDirection === 8 && <ArrowUp size={16} />}
                                    {resizeDirection === 9 && <ArrowUpLeft size={16} />}
                                </ResizeDirectionBox>
                                <ResizeDirectionBox onClick={() => setResizeDirection(6)}>
                                    {resizeDirection === 2 && <ArrowDownRight size={16} />}
                                    {resizeDirection === 3 && <ArrowDown size={16} />}
                                    {resizeDirection === 5 && <ArrowRight size={16} />}
                                    {resizeDirection === 6 && <Circle size={16} />}
                                    {resizeDirection === 8 && <ArrowUpRight size={16} />}
                                    {resizeDirection === 9 && <ArrowUp size={16} />}
                                </ResizeDirectionBox>
                            </HContainer>
                            <HContainer>
                                <ResizeDirectionBox onClick={() => setResizeDirection(7)}>
                                    {resizeDirection === 4 && <ArrowDown size={16} />}
                                    {resizeDirection === 5 && <ArrowDownLeft size={16} />}
                                    {resizeDirection === 7 && <Circle size={16} />}
                                    {resizeDirection === 8 && <ArrowLeft size={16} />}
                                </ResizeDirectionBox>
                                <ResizeDirectionBox onClick={() => setResizeDirection(8)}>
                                    {resizeDirection === 4 && <ArrowDownRight size={16} />}
                                    {resizeDirection === 5 && <ArrowDown size={16} />}
                                    {resizeDirection === 6 && <ArrowDownLeft size={16} />}
                                    {resizeDirection === 7 && <ArrowRight size={16} />}
                                    {resizeDirection === 8 && <Circle size={16} />}
                                    {resizeDirection === 9 && <ArrowLeft size={16} />}
                                </ResizeDirectionBox>
                                <ResizeDirectionBox onClick={() => setResizeDirection(9)}>
                                    {resizeDirection === 5 && <ArrowDownRight size={16} />}
                                    {resizeDirection === 6 && <ArrowDown size={16} />}
                                    {resizeDirection === 8 && <ArrowRight size={16} />}
                                    {resizeDirection === 9 && <Circle size={16} />}
                                </ResizeDirectionBox>
                            </HContainer>
                        </VContainer>
                    </HContainer>
                </PopUpDialog>
            }
        </VContainer>
    );
}
