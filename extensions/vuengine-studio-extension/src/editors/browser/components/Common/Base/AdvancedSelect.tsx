import React, { FunctionComponent, useContext } from 'react';
import Select, { GroupBase, MenuPlacement, OptionProps } from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';

export interface AdvancedSelectOption {
    value: string
    label: string
    disabled?: boolean
};

const CustomClearIndicator: FunctionComponent<OptionProps<AdvancedSelectOption, true, GroupBase<AdvancedSelectOption>>> = ({ innerProps, isDisabled }) => <>{
    !isDisabled &&
    <div {...innerProps} className='react-select__indicator react-select__clear-indicator'>
        <i className='codicon codicon-x' />
    </div>
}</>;

const CustomDropdownIndicator: FunctionComponent = () =>
    <div className='react-select__indicator react-select__dropdown-indicator'>
        <i className='codicon codicon-chevron-down' />
    </div>;

const CustomMultiValueRemove: FunctionComponent<OptionProps<AdvancedSelectOption, true, GroupBase<AdvancedSelectOption>>> = ({ innerProps, isDisabled }) => <>{
    !isDisabled &&
    <div {...innerProps} className='react-select__multi-value__remove'>
        <i className='codicon codicon-x' />
    </div>
}</>;

interface AdvancedSelectProps {
    options: AdvancedSelectOption[]
    multi?: boolean
    disabled?: boolean
    defaultValue: string | string[]
    placeholder?: string
    menuPlacement?: MenuPlacement
    onChange: (options: string[]) => void
    onCreateOption?: (value: string) => void
    commands?: string[]
    width?: number
}

export default function AdvancedSelect(props: AdvancedSelectProps): React.JSX.Element {
    const {
        options, multi, disabled, defaultValue, placeholder, menuPlacement, commands, width, onChange, onCreateOption
    } = props;
    const { enableCommands, disableCommands } = useContext(EditorsContext) as EditorsContextType;

    const value: AdvancedSelectOption[] = [];
    options.map(o => {
        if (defaultValue && defaultValue.includes(o.value)) {
            value.push(o);
        }
    });

    const handleOnFocus = () => {
        if (commands !== undefined && commands.length) {
            disableCommands(commands);
        }
    };

    const handleOnBlur = () => {
        if (commands !== undefined && commands.length) {
            enableCommands(commands);
        }
    };

    const SelectType = onCreateOption ? CreatableSelect : Select;
    return <SelectType
        value={value}
        onChange={multi
            ? (opts: AdvancedSelectOption[]) => onChange(opts.map(opt => opt.value))
            : (opt: AdvancedSelectOption) => onChange([opt.value])
        }
        onCreateOption={onCreateOption}
        options={options}
        isMulti={multi}
        isDisabled={disabled}
        isSearchable
        placeholder={placeholder ?? ''}
        components={{
            ClearIndicator: CustomClearIndicator,
            MultiValueRemove: CustomMultiValueRemove,
            DropdownIndicator: CustomDropdownIndicator,
        }}
        // menuIsOpen={true}
        isOptionDisabled={option => option.disabled ?? false}
        unstyled
        className="react-select-container"
        classNamePrefix="react-select"
        maxMenuHeight={212}
        menuPlacement={menuPlacement}
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
        styles={{
            control: baseStyles => ({
                ...baseStyles,
                width,
            }),
        }}
    />;
}
