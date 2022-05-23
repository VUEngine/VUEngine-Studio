import {
    EnumCellProps,
    isEnumControl,
    RankedTester,
    rankWith
} from '@jsonforms/core';
import { withJsonFormsOneOfEnumCellProps } from '@jsonforms/react';
import { VanillaRendererProps, withVanillaEnumCellProps } from '@jsonforms/vanilla-renderers/lib';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React from 'react';

export const VesDropdown = (props: EnumCellProps & VanillaRendererProps) => {
    const { data, id, uischema, path, handleChange, options } = props;
    return (
        <div className='input-with-decoration'>
            {uischema.options?.inputPrefix &&
                <div className='theia-input prefix'>{uischema.options?.inputPrefix}</div>}
            <SelectComponent
                key={id}
                value={data}
                options={options || []}
                onChange={option => handleChange(path, option.value)} />
        </div>
    );
};

export const enumCellTester: RankedTester = rankWith(2, isEnumControl);

export default withJsonFormsOneOfEnumCellProps(withVanillaEnumCellProps(VesDropdown));
