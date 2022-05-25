import {
    CellProps, RankedTester,
    rankWith,
    scopeEndsWith
} from '@jsonforms/core';
import { withJsonFormsCellProps } from '@jsonforms/react';
import { VanillaRendererProps } from '@jsonforms/vanilla-renderers/lib';
import { withVanillaCellProps } from '@jsonforms/vanilla-renderers/lib/util';
import React from 'react';

/*
export interface VesServiceProps extends ControlProps {
    testProp?: string;
}

export declare const withVesServices:
    (Component: ComponentType<VesServiceProps>, memoize?: boolean) => ComponentType<OwnPropsOfControl>;
*/

export const VesFolder = (props: CellProps & VanillaRendererProps) => {
    const { data, className, id, enabled, uischema, path, handleChange } = props;

    const selectDirectory = async (currentValue: string) => {
        /*
        const openFileDialogProps: OpenFileDialogProps = {
            title: 'Select image(s) folder',
            canSelectFolders: true,
            canSelectFiles: false
        };
         const currentPath = (currentValue && await services.fileService.exists(new URI(currentValue).withScheme('file')))
            ? await services.fileService.resolve(new URI(currentValue).withScheme('file'))
            : undefined;
        const dirUri = await services.fileDialogService.showOpenDialog(openFileDialogProps, currentPath);
        if (dirUri) {
            const destinationFolder = await services.fileService.resolve(dirUri);
            if (destinationFolder.isDirectory) {
                // TODO
            }
        }*/
    };

    return (
        <div className='input-with-decoration input-folder'>
            {uischema.options?.inputPrefix &&
                <div className='theia-input prefix'>{uischema.options?.inputPrefix}</div>}
            <input
                type='string'
                value={data}
                onChange={ev => handleChange(path, ev.target.value)}
                className={className}
                id={id}
                disabled={!enabled}
                autoFocus={uischema.options && uischema.options.focus}
                onClick={() => selectDirectory(data)}
            />
            <button
                className='theia-button secondary'
            >
                <i className='fa fa-ellipsis-h'></i>
            </button>
        </div>
    );
};

export const folderCellTester: RankedTester = rankWith(2, scopeEndsWith('/folder'));

export default withJsonFormsCellProps(withVanillaCellProps(VesFolder));
