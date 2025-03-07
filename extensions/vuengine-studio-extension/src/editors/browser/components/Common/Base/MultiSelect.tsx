import React, { FunctionComponent } from 'react';
import { GroupBase, MenuPlacement, OptionProps } from 'react-select';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';

export interface MultiSelectOption {
    value: string
    label: string
};

const CustomClearIndicator: FunctionComponent<OptionProps<MultiSelectOption, true, GroupBase<MultiSelectOption>>> = ({ innerProps, isDisabled }) => <>{
    !isDisabled &&
    <div {...innerProps} className='react-select__indicator react-select__clear-indicator'>
        <i className='codicon codicon-x' />
    </div>
}</>;

const CustomDropdownIndicator: FunctionComponent = () =>
    <div className='react-select__indicator react-select__dropdown-indicator'>
        <i className='codicon codicon-chevron-down' />
    </div>;

const CustomMultiValueRemove: FunctionComponent<OptionProps<MultiSelectOption, true, GroupBase<MultiSelectOption>>> = ({ innerProps, isDisabled }) => <>{
    !isDisabled &&
    <div {...innerProps} className='react-select__multi-value__remove'>
        <i className='codicon codicon-x' />
    </div>
}</>;

interface MultiSelectProps {
    options: MultiSelectOption[]
    canSelectMany?: boolean
    defaultValue: string | string[]
    placeholder?: string
    menuPlacement?: MenuPlacement
    onChange: (options: string[]) => void
    onCreateOption?: (value: string) => void
}

export default function MultiSelect(props: MultiSelectProps): React.JSX.Element {
    const { options, canSelectMany, defaultValue, placeholder, menuPlacement, onChange, onCreateOption } = props;

    const value: MultiSelectOption[] = [];
    options.map(o => {
        if (defaultValue && defaultValue.includes(o.value)) {
            value.push(o);
        }
    });

    const SelectType = onCreateOption ? CreatableSelect : Select;
    return <SelectType
        value={value}
        onChange={(opts: MultiSelectOption[]) => onChange(opts.map(opt => opt.value))}
        onCreateOption={onCreateOption}
        options={options}
        isMulti={canSelectMany ?? true}
        isSearchable
        placeholder={placeholder ?? ''}
        components={{
            ClearIndicator: CustomClearIndicator,
            MultiValueRemove: CustomMultiValueRemove,
            DropdownIndicator: CustomDropdownIndicator,
        }}
        // menuIsOpen={true}
        unstyled
        className="react-select-container"
        classNamePrefix="react-select"
        maxMenuHeight={212}
        menuPlacement={menuPlacement}
    />;
}
