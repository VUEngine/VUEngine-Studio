import React from 'react';
import { EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/HContainer';
import VContainer from '../Common/VContainer';
import { StageData, StageEditorContext, StageEditorState } from './StageEditorTypes';

interface StageEditorProps {
  data: StageData;
  updateData: (entityData: StageData) => void;
  context: EditorsContextType
}

export interface StageEditorSaveDataOptions {
  appendImageData?: boolean
}

export default class StageEditor extends React.Component<StageEditorProps, StageEditorState> {
  constructor(props: StageEditorProps) {
    super(props);
    this.state = {
      currentComponent: '',
      preview: {
        backgroundColor: -1,
        anaglyph: false,
        colliders: true,
        wireframes: true,
        palettes: ['11100100', '11100000', '11010000', '11100100'],
        sprites: true,
        zoom: 1,
        projectionDepth: 128,
      },
    };
  }

  render(): React.JSX.Element {
    const { data } = this.props;

    return (
      <StageEditorContext.Provider
        value={{
          state: this.state,
          setState: this.setState.bind(this),
          data,
          setData: this.props.updateData.bind(this),
        }}
      >
        <HContainer className="stageEditor" gap={0} grow={1} overflow='hidden'>
          <StageEditorContext.Consumer>
            {context =>
              <VContainer gap={15} overflow='hidden' style={{ maxWidth: 200, minWidth: 200 }}>
                <VContainer gap={15} grow={1} overflow='auto'>
                  Tree
                </VContainer>
              </VContainer>
            }
          </StageEditorContext.Consumer>
          <StageEditorContext.Consumer>
            {context =>
              this.state.currentComponent?.startsWith('scripts-')
                ? 'SCRIPT'
                : 'Preview'
            }
          </StageEditorContext.Consumer>
          <StageEditorContext.Consumer>
            {context =>
              <VContainer gap={15} overflow='auto' style={{ maxWidth: 300, minWidth: 300 }}>
                CurrentComponent
              </VContainer>
            }
          </StageEditorContext.Consumer>
        </HContainer>

      </StageEditorContext.Provider>
    );
  }
}
