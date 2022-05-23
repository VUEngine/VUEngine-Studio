import {
    CellProps,
    isIntegerControl,
    RankedTester,
    rankWith
} from '@jsonforms/core';
import { withJsonFormsCellProps } from '@jsonforms/react';
import { VanillaRendererProps } from '@jsonforms/vanilla-renderers/lib';
import { withVanillaCellProps } from '@jsonforms/vanilla-renderers/lib/util';
import React from 'react';

export const VesInteger = (props: CellProps & VanillaRendererProps) => {
    const { data, className, id, enabled, schema, uischema, path, handleChange } = props;
    return (
        <div className='input-with-decoration'>
            {uischema.options?.inputPrefix &&
                <div className='theia-input prefix'>{uischema.options?.inputPrefix}</div>}
            <input
                type='number'
                step='1'
                min={schema.minimum}
                max={schema.maximum}
                value={data}
                onChange={ev => handleChange(path, parseInt(ev.target.value, 10))}
                className={className}
                id={id}
                disabled={!enabled}
                autoFocus={uischema.options && uischema.options.focus}
            />
        </div>
    );
};

export const integerCellTester: RankedTester = rankWith(2, isIntegerControl);

export default withJsonFormsCellProps(withVanillaCellProps(VesInteger));
