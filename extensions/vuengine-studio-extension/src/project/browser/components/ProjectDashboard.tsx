import { PuzzlePiece } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useState } from 'react';
import { ArcherContainer } from 'react-archer';
import styled from 'styled-components';
import { WHEEL_SENSITIVITY } from '../../../editors/browser/components/ActorEditor/ActorEditorTypes';
import VContainer from '../../../editors/browser/components/Common/Base/VContainer';
import Sidebar from '../../../editors/browser/components/Common/Editor/Sidebar';
import ProjectSettings from './ProjectSettings';
import StagePreview, { MOCK_STAGES } from './StagePreview';

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
// const ZOOM_STEP = 0.5;

const DashboardContainer = styled.div`
    align-items: end;
    overflow: hidden !important;

    > div:first-child {
        inset: 0;
        overflow: auto;
        padding: calc(var(--theia-ui-padding) * 2);
        position: absolute !important;

        > svg {
            box-sizing: border-box;
            overflow: visible;
            padding: 12px;
            z-index: 10;
        }

        > div {
            display: flex;
            height: unset !important;
            min-height: 100%;
        }
    }
`;

const EmptyContainer = styled.div`
    align-items: center;
    color: var(--theia-dropdown-border);
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: 5px;
    inset: 0;
    justify-content: center;
    position: absolute;
`;

export default function ProjectDashboard(): React.JSX.Element {
    const [currentStage, setCurrentStage] = useState<string>('');
    const [scale, setScale] = useState<number>(1);
    const [previewMode, setPreviewMode] = useState<boolean>(false);

    const DragContainer = styled.div`
        background-image: radial-gradient(rgba(0, 0, 0, .5) ${scale}px, transparent 0);
        background-position: ${8 * scale}px ${8 * scale}px;
        background-size: ${16 * scale}px ${16 * scale}px;
        display: flex;
        flex-direction: column;
        gap: ${32 * scale}px;
        margin: calc(var(--theia-ui-padding) * -2);
        padding: ${16 * scale}px;
        width: 100%;
    `;

    const onWheel = (e: React.WheelEvent): void => {
        if (e.ctrlKey) {
            let z = scale - e.deltaY / WHEEL_SENSITIVITY;

            if (z > ZOOM_MAX) {
                z = ZOOM_MAX;
            } else if (z < ZOOM_MIN) {
                z = ZOOM_MIN;
            }

            setScale(z);
        }
    };

    const addStage = async () => {
        const dialog = new ConfirmDialog({
            title: 'Activate Preview',
            msg: 'Sorry, a stage editor has not yet been implemented. \n\
                You will need to manually create stages for now, consult the documentation for help. \n\
                Do you want to enable a preview of the dashboard with mocked data?'
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            setPreviewMode(true);
        }
    };

    return (
        <DashboardContainer
            onClick={() => setCurrentStage('')}
            onWheel={onWheel}
        >
            {previewMode && Object.keys(MOCK_STAGES).length > 0
                ?
                <ArcherContainer
                    lineStyle="angle"
                    offset={-8}
                    strokeColor="var(--theia-foreground)"
                    strokeWidth={2}
                >
                    <DragContainer>
                        <StagePreview
                            id={Object.keys(MOCK_STAGES)[0]}
                            current={Object.keys(MOCK_STAGES)[0] === currentStage}
                            scale={scale}
                            onClick={e => {
                                setCurrentStage(Object.keys(MOCK_STAGES)[0]);
                            }}
                            relations={[
                                {
                                    targetId: '2345',
                                    targetAnchor: 'top',
                                    sourceAnchor: 'bottom',
                                },
                            ]}
                        />
                        <StagePreview
                            id={Object.keys(MOCK_STAGES)[1]}
                            current={Object.keys(MOCK_STAGES)[1] === currentStage}
                            scale={scale}
                            onClick={e => {
                                setCurrentStage(Object.keys(MOCK_STAGES)[1]);
                            }}
                            relations={[
                                {
                                    targetId: '3456',
                                    targetAnchor: 'top',
                                    sourceAnchor: 'bottom',
                                },
                            ]}
                        />
                        <StagePreview
                            id={Object.keys(MOCK_STAGES)[2]}
                            current={Object.keys(MOCK_STAGES)[2] === currentStage}
                            scale={scale}
                            onClick={e => {
                                setCurrentStage(Object.keys(MOCK_STAGES)[2]);
                            }}
                            relations={[
                                {
                                    targetId: '4567',
                                    targetAnchor: 'top',
                                    sourceAnchor: 'bottom',
                                },
                            ]}
                        />
                        <StagePreview
                            id={Object.keys(MOCK_STAGES)[3]}
                            current={Object.keys(MOCK_STAGES)[3] === currentStage}
                            scale={scale}
                            onClick={e => {
                                setCurrentStage(Object.keys(MOCK_STAGES)[3]);
                            }}
                        />
                    </DragContainer>
                </ArcherContainer>
                : <>
                    <div></div>
                    <EmptyContainer>
                        <PuzzlePiece size={32} />
                        <div
                            style={{
                                fontSize: '160%'
                            }}
                        >
                            {nls.localize(
                                'vuengine/project/projectHasNoStages',
                                'This project does not yet have any stages',
                            )}
                        </div>
                        <div>
                            {nls.localize(
                                'vuengine/project/clickBelowToAddFirstStage',
                                'Click below to add the first stage',
                            )}
                        </div>
                        <button
                            className='theia-button secondary large'
                            onClick={addStage}
                            style={{
                                marginTop: 20
                            }}
                        >
                            <i className='codicon codicon-add' /> {nls.localizeByDefault('Add')}
                        </button>
                    </EmptyContainer>
                </>
            }
            <Sidebar
                open={true}
                side='right'
                width={320}
            >
                {
                    currentStage === ''
                        ? <VContainer
                            gap={15}
                            overflow="auto"
                            style={{ padding: 'calc(2 * var(--theia-ui-padding))' }}
                        >
                            <ProjectSettings />
                        </VContainer>
                        : <VContainer
                            gap={15}
                            overflow="auto"
                            style={{ padding: 'calc(2 * var(--theia-ui-padding))' }}
                        >
                            Stage
                        </VContainer>
                }
            </Sidebar>
        </DashboardContainer>
    );
}
