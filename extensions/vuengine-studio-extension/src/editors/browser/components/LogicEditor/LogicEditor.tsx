import { nls } from '@theia/core';
import React, { useState } from 'react';
import { EditorsContextType } from '../../ves-editors-types';
import { EditorSidebar, HideTreeButton, ShowTreeButton } from '../ActorEditor/ActorEditor';
import HContainer from '../Common/Base/HContainer';
import { LogicData, LogicEditorContext } from './LogicEditorTypes';
import Script from './Scripts/Script';
import ScriptedActionDetail from './Scripts/ScriptedActionDetail';
import MethodsTree from './Tree/MethodsTree';

interface LogicEditorProps {
  data: LogicData;
  updateData: (logicData: LogicData) => void;
  context: EditorsContextType
}

export const INPUT_BLOCKING_COMMANDS = [
];

export default function LogicEditor(props: LogicEditorProps): React.JSX.Element {
  const { data, updateData } = props;
  const [currentComponent, setCurrentComponent] = useState<string>('');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(true);

  return (
    <div
      className="actorEditor"
      tabIndex={0}
    >
      <LogicEditorContext.Provider
        value={{
          data,
          updateData,
          currentComponent,
          setCurrentComponent,
        }}
      >
        <LogicEditorContext.Consumer>
          {context =>
            <>
              {currentComponent !== '' &&
                <Script
                  index={parseInt(currentComponent?.split('-')[1] ?? '0')}
                />
              }
            </>
          }
        </LogicEditorContext.Consumer>
        <LogicEditorContext.Consumer>
          {context => <HContainer
            alignItems='start'
            grow={1}
            justifyContent='space-between'
            overflow='hidden'
            style={{
              marginBottom: 40,
            }}
          >
            <EditorSidebar
              style={{
                marginLeft: leftSidebarOpen ? 0 : 'calc(-320px - 1px - var(--padding))',
                position: 'relative',
              }}
            >
              <HideTreeButton
                className="theia-button secondary"
                title={nls.localize('vuengine/logicEditor/showMethodsTree', 'Show Methods Tree')}
                onClick={() => setLeftSidebarOpen(false)}
              >
                <i className="codicon codicon-chevron-left" />
              </HideTreeButton>
              <MethodsTree />
            </EditorSidebar>
            {!leftSidebarOpen &&
              <ShowTreeButton
                style={{
                  opacity: leftSidebarOpen ? 0 : 1,
                }}
                className="theia-button secondary"
                title={nls.localize('vuengine/logicEditor/showMethodsTree', 'Show Methods Tree')}
                onClick={() => setLeftSidebarOpen(true)}
              >
                <i className="codicon codicon-list-tree" />
              </ShowTreeButton>
            }
            {currentComponent !== '' &&
              <EditorSidebar
                style={{
                  marginRight: currentComponent.includes('-') || ['animations', 'colliders', 'extraProperties', 'body', 'logic', 'sprites'].includes(currentComponent)
                    ? 0
                    : 'calc(-320px - 1px - var(--padding))',
                }}

              >
                <ScriptedActionDetail />
              </EditorSidebar>
            }
          </HContainer>
          }
        </LogicEditorContext.Consumer>
      </LogicEditorContext.Provider>
    </div>
  );
}
