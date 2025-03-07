import { nls } from '@theia/core';
import React, { useContext, useEffect, useState } from 'react';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import { HideTreeButton, ShowTreeButton } from '../ActorEditor/ActorEditor';
import HContainer from '../Common/Base/HContainer';
import { LogicData, LogicEditorContext } from './LogicEditorTypes';
import Script from './Scripts/Script';
import ScriptedActionDetail from './Scripts/ScriptedActionDetail';
import MethodsTree from './Tree/MethodsTree';
import { CommonEditorCommands } from '../Common/Editor/CommonEditorCommands';
import Sidebar from '../Common/Editor/Sidebar';

interface LogicEditorProps {
  data: LogicData;
  updateData: (logicData: LogicData) => void;
  context: EditorsContextType
}

export const INPUT_BLOCKING_COMMANDS = [
];

export default function LogicEditor(props: LogicEditorProps): React.JSX.Element {
  const { data, updateData } = props;
  const { enableCommands } = useContext(EditorsContext) as EditorsContextType;
  const [currentComponent, setCurrentComponent] = useState<string>('');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(true);

  useEffect(() => {
    enableCommands([
      ...Object.values(CommonEditorCommands).map(c => c.id)
    ]);
  }, []);

  return (
    <div
      className="logicEditor"
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
          >
            <Sidebar
              open={leftSidebarOpen}
              side='left'
              width={320}
            >
              <HideTreeButton
                className="theia-button secondary"
                title={nls.localize('vuengine/editors/logic/showMethodsTree', 'Show Methods Tree')}
                onClick={() => setLeftSidebarOpen(false)}
              >
                <i className="codicon codicon-chevron-left" />
              </HideTreeButton>
              <MethodsTree />
            </Sidebar>
            {!leftSidebarOpen &&
              <ShowTreeButton
                style={{
                  opacity: leftSidebarOpen ? 0 : 1,
                }}
                className="theia-button secondary"
                title={nls.localize('vuengine/editors/logic/showMethodsTree', 'Show Methods Tree')}
                onClick={() => setLeftSidebarOpen(true)}
              >
                <i className="codicon codicon-list-tree" />
              </ShowTreeButton>
            }
            {currentComponent !== '' &&
              <Sidebar
                open={true}
                side='right'
                width={320}
              >
                <ScriptedActionDetail />
              </Sidebar>
            }
          </HContainer>
          }
        </LogicEditorContext.Consumer>
      </LogicEditorContext.Provider>
    </div>
  );
}
