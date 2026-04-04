import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import GameConfigEditor from '../../components/GameConfigEditor/GameConfigEditor';
import { EditorsContext } from '../../ves-editors-types';
import { GameConfigData } from '../../components/GameConfigEditor/GameConfigEditorTypes';

interface VesGameConfigEditorControlProps {
    data: GameConfigData;
    handleChange(path: string, value: GameConfigData): void;
    path: string;
}

const VesGameConfigEditorControl = ({ data, handleChange, path }: VesGameConfigEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <GameConfigEditor
            data={data}
            updateData={(newValue: GameConfigData) => {
                if (!context.isReadonly) {
                    handleChange(path, newValue);
                }
            }}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesGameConfigEditorControl);
