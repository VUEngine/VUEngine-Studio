import { nls } from '@theia/core';
import { ExtractableWidget, Message, StatusBar, StatusBarEntry } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { ArcherContainer } from 'react-archer';
import styled from 'styled-components';
import { WHEEL_SENSITIVITY } from '../../editors/browser/components/ActorEditor/ActorEditorTypes';
import Scalable from '../../editors/browser/components/Common/Editor/Scalable';
import { EditorsContext } from '../../editors/browser/ves-editors-types';
import StagePreview, { MOCK_STAGES } from './components/StagePreview';
import { VesProjectService } from './ves-project-service';

const DashboardOuterContainer = styled.div`
    svg {
        z-index: 10;
    }
`;

const DashboardContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20;
    height: 100%;
`;

@injectable()
export class VesProjectDashboardWidget extends ReactWidget implements ExtractableWidget {
    @inject(StatusBar)
    protected readonly statusBar: StatusBar;
    @inject(VesProjectService)
    protected readonly vesProjectService: VesProjectService;

    static readonly ID = 'vesProjectDashboardWidget';
    static readonly LABEL = nls.localize('vuengine/project/dashboard', 'Project Dashboard');

    protected resource = '';

    isExtractable: boolean = true;
    secondaryWindow: Window | undefined;

    @postConstruct()
    protected init(): void {
        this.doInit();

        const label = nls.localize('vuengine/project/project', 'Project');
        this.id = VesProjectDashboardWidget.ID;
        this.title.label = label;
        this.title.caption = 'Project Dashboard';
        this.title.iconClass = 'codicon codicon-home';
        this.title.closable = true;
        this.node.style.outline = 'none';

        this.update();
    }

    protected async doInit(): Promise<void> {
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.node.tabIndex = 0;
        this.node.focus();
    }

    protected render(): React.ReactNode {
        return (
            <EditorsContext.Provider
                // @ts-ignore
                value={{
                    setStatusBarItem: (id: string, entry: StatusBarEntry) => this.statusBar.setElement(id, entry),
                    removeStatusBarItem: (id: string) => this.statusBar.removeElement(id),
                }}
            >
                <DashboardOuterContainer>
                    <Scalable
                        minZoom={0.25}
                        maxZoom={5}
                        wheelSensitivity={WHEEL_SENSITIVITY}
                        zoomStep={.5}
                    >
                        <ArcherContainer
                            lineStyle="angle"
                            offset={-8}
                            strokeColor="var(--theia-foreground)"
                            strokeWidth={2}
                        >
                            <DashboardContainer>
                                <StagePreview
                                    id={Object.keys(MOCK_STAGES)[0]}
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
                                />
                            </DashboardContainer>
                        </ArcherContainer>
                    </Scalable>
                </DashboardOuterContainer>
            </EditorsContext.Provider>
        );
    }
}
