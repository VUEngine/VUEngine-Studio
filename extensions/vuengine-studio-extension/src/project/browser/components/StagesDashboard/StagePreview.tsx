import React, { useRef, useState } from 'react';
import { ArcherContainerRef, ArcherElement } from 'react-archer';
import { AnchorPositionType, RelationType } from 'react-archer/lib/types';
import Draggable, { ControlPosition, DraggableData, DraggableEvent } from 'react-draggable';
import styled from 'styled-components';
import { roundToNextMultipleOf16 } from '../../../../editors/browser/components/Common/Utils';
import { DashboardConfigPositionMap } from '../../ves-project-types';
import { MOCK_AUTO_PAUSE_SCREEN, MOCK_STAGES, MOCK_START_SCREEN } from './ProjectDashboard';

const ARROW_PADDING = 30;

const StagePreviewPadding = styled.div`
    position: absolute;
`;

const StagePreviewContainer = styled.div`
    background-color: #000;
    background-position: left top;
    background-repeat: no-repeat;
    background-size: contain;
    border-radius: 5px;
    cursor: grab;
    display: flex;
    outline: 0px solid var(--theia-focusBorder);
    outline-offset: 1px;
    overflow: hidden;

    &.isCurrent,
    &:hover {
        outline-width: 1px;
    }
`;

const StagePreviewInnerContainer = styled.div`
    display: flex;
    flex-grow: 1;
`;

const StagePreviewStart = styled.div`
    display: none;

    ${StagePreviewContainer}.isStart & {
        display: flex;
    }
`;

const StagePreviewAutoPause = styled.div`
    display: none;

    ${StagePreviewContainer}.isAutoPause & {
        display: flex;
    }
`;

const StagePreviewHeader = styled.div`
    align-items: center;
    background-color: rgba(0, 0, 0, .75);
    box-sizing: border-box;
    color: #fff;
    cursor: pointer;
    display: flex;
    flex-grow: 1;
    gap: 10px;
    height: 40px;
    overflow: hidden;
    padding: 0 calc(2 * var(--theia-ui-padding));
    visibility: hidden;


    .codicon[class*='codicon-'] {
        font-size: 20px;
        margin-top: 4px;
    }

    ${StagePreviewContainer}.isStart:not(:hover) & {
        visibility: visible;
        width: 42px;
        flex-grow: 0;
        border-bottom-right-radius: 2px;
    }

    ${StagePreviewContainer}.isAutoPause:not(:hover) & {
        visibility: visible;
        width: 42px;
        flex-grow: 0;
        border-bottom-right-radius: 2px;
    }

    ${StagePreviewContainer}.isStart.isAutoPause:not(:hover) & {
        width: 72px;
    }

    ${StagePreviewContainer}:hover & {
        visibility: visible;
    }
`;

interface StagePreviewProps {
    id: string
    stage: any
    archerRef: React.RefObject<ArcherContainerRef>
    positions: DashboardConfigPositionMap
    setPosition: (position: ControlPosition) => void
    current: boolean
    scale: number
    relations?: RelationType[]
    onClick?: (e: React.MouseEvent) => void
}

export default function StagePreview(props: StagePreviewProps): React.JSX.Element {
    const { id, stage, archerRef, positions, setPosition, current, scale, relations, onClick } = props;
    const position = positions && positions[id] ? positions[id] : { x: 0, y: 0 };
    const [pos, setPos] = useState<ControlPosition>(position);
    const nodeRef = useRef(null);

    const height = roundToNextMultipleOf16(stage.height) * scale;
    const width = roundToNextMultipleOf16(stage.width) * scale;

    const classNames = ['stage'];
    if (id === MOCK_START_SCREEN) {
        classNames.push('isStart');
    }
    if (id === MOCK_AUTO_PAUSE_SCREEN) {
        classNames.push('isAutoPause');
    }
    if (current) {
        classNames.push('isCurrent');
    }

    const onDrag = (e: DraggableEvent, data: DraggableData) => {
        archerRef.current?.refreshScreen();
    };

    const onDragStop = (e: DraggableEvent, data: DraggableData) => {
        const newPosition = {
            x: roundToNextMultipleOf16(data.x / scale),
            y: roundToNextMultipleOf16(data.y / scale),
        };

        setPosition(newPosition);
        setPos(newPosition);
    };

    const processRelations = (rlts: RelationType[] | undefined): RelationType[] | undefined =>
        rlts?.map(r => {
            const targetPosition = positions && positions[r.targetId] ? positions[r.targetId] : { x: 0, y: 0 };

            let sourceAnchor: AnchorPositionType = 'right';
            let targetAnchor: AnchorPositionType = 'left';

            if (position.x >= targetPosition.x + MOCK_STAGES[r.targetId].width + ARROW_PADDING) {
                sourceAnchor = 'left';
                targetAnchor = 'right';
            }

            if (position.y >= targetPosition.y + MOCK_STAGES[r.targetId].height + ARROW_PADDING) {
                sourceAnchor = 'top';
                targetAnchor = 'bottom';
            } else if (position.y + MOCK_STAGES[id].height + ARROW_PADDING <= targetPosition.y) {
                sourceAnchor = 'bottom';
                targetAnchor = 'top';
            }

            return { ...r, sourceAnchor, targetAnchor };
        });

    return (
        <Draggable
            nodeRef={nodeRef}
            grid={[16 * scale, 16 * scale]}
            handle=".stage"
            onStop={onDragStop}
            onDrag={onDrag}
            position={{
                x: pos.x * scale,
                y: pos.y * scale,
            }}
        >
            <StagePreviewPadding
                ref={nodeRef}
                style={{
                    padding: 32 * scale,
                }}
            >
                <StagePreviewContainer
                    className={classNames.join(' ')}
                    style={{
                        backgroundImage: `url("${stage.image}")`,
                        height,
                        width,
                    }}
                    onClick={(onClick)}
                >
                    <ArcherElement
                        id={id}
                        relations={processRelations(relations)}
                    >
                        <StagePreviewInnerContainer>
                            <StagePreviewHeader>
                                <StagePreviewStart>
                                    <i className='codicon codicon-home' />
                                </StagePreviewStart>
                                <StagePreviewAutoPause>
                                    <i className='codicon codicon-watch' />
                                </StagePreviewAutoPause>
                                {stage.name}
                            </StagePreviewHeader>
                        </StagePreviewInnerContainer>
                    </ArcherElement>
                </StagePreviewContainer>
            </StagePreviewPadding>
        </Draggable>
    );
}
