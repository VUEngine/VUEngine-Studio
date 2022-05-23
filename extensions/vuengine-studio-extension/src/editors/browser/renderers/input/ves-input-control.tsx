import {
    computeLabel,
    ControlProps,
    ControlState,
    EnumCellProps,
    isControl,
    isDescriptionHidden, isIntegerControl, isOneOfControl, RankedTester,
    rankWith
} from '@jsonforms/core';
import {
    Control,
    withJsonFormsControlProps
} from '@jsonforms/react';
import React from 'react';
import { VanillaRendererProps } from '@jsonforms/vanilla-renderers/lib';
import { withVanillaControlProps } from '@jsonforms/vanilla-renderers/lib/util';
import VesInteger from './ves-integer';
import merge from 'lodash/merge';
import VesDropdown from './ves-dropdown';

export class VesInputControl extends Control<
    ControlProps & EnumCellProps & VanillaRendererProps,
    ControlState
> {
    // eslint-disable-next-line @typescript-eslint/tslint/config
    render() {
        const {
            classNames,
            description,
            id,
            errors,
            label,
            uischema,
            schema,
            visible,
            required,
            path,
            options,
            config
        } = this.props;

        const isValid = errors.length === 0;

        const divClassNames = [classNames?.validation]
            .concat(isValid ? classNames?.description : classNames?.validationError)
            .join(' ');

        const appliedUiSchemaOptions = merge({}, config, uischema.options);
        const showDescription = !isDescriptionHidden(
            visible,
            description || '',
            this.state.isFocused,
            appliedUiSchemaOptions.showUnfocusedDescription
        );

        return (
            <div
                className={classNames?.wrapper}
                hidden={!visible}
                onFocus={this.onFocus}
                onBlur={this.onBlur}
                id={id}
            >
                <label htmlFor={id + '-input'} className={classNames?.label}>
                    {computeLabel(
                        label,
                        required || false,
                        appliedUiSchemaOptions.hideRequiredAsterisk
                    )}
                </label>
                {isIntegerControl(uischema, schema) &&
                    !isOneOfControl(uischema, schema) &&
                    <VesInteger
                        uischema={uischema}
                        schema={schema}
                        path={path}
                        id={id + '-input'}
                    />}
                {isOneOfControl(uischema, schema) && <VesDropdown
                    uischema={uischema}
                    schema={schema}
                    path={path}
                    id={id + '-input'}
                    options={options}
                />}
                <div className={divClassNames}>
                    {!isValid ? errors : showDescription ? description : undefined}
                </div>
            </div>
        );
    }
}

export const inputControlTester: RankedTester = rankWith(1, isControl);

export default withVanillaControlProps(withJsonFormsControlProps(VesInputControl));
