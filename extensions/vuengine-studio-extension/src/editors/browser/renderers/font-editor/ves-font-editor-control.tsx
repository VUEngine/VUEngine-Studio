import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import FontEditor from '../../components/FontEditor/FontEditor';
import { FontData } from '../../components/FontEditor/FontEditorTypes';

interface VesFontEditorControlProps {
    data: FontData;
    handleChange(path: string, value: FontData): void;
    path: string;
    config?: any;
}

const removeTrailingNullsFromArray = (arr: any[]): any[] | null => {
    // eslint-disable-next-line no-null/no-null
    if (arr === null) {
        return arr;
    }

    let toDelete = 0;
    for (let c = arr.length - 1; c >= 0; c--) {
        // eslint-disable-next-line no-null/no-null
        if (arr[c] === null) {
            toDelete++;
        } else {
            break;
        }
    }
    arr.splice(arr.length - toDelete, toDelete);

    // eslint-disable-next-line no-null/no-null
    return arr.length ? arr : null;
};

const optimizeFontData = (fontData: FontData): FontData => {
    // @ts-ignore
    // eslint-disable-next-line no-null/no-null
    fontData.characters = fontData.characters === null ? null :
        removeTrailingNullsFromArray(fontData.characters.map(character =>
            // eslint-disable-next-line no-null/no-null
            character === null ? null :
                removeTrailingNullsFromArray(character.map(line =>
                    removeTrailingNullsFromArray(line)
                ))));

    return fontData;
};

const VesFontEditorControl = ({ data, handleChange, path, config }: VesFontEditorControlProps) =>
    <FontEditor
        fontData={data}
        updateFontData={(newValue: FontData) => handleChange(path, optimizeFontData(newValue))}
        fileUri={config.fileUri}
        services={config.services}
    />;

export default withJsonFormsControlProps(VesFontEditorControl);
