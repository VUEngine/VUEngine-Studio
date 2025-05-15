import chroma from 'chroma-js';
import React, { FunctionComponent, useContext } from 'react';
import Select, { GroupBase, MenuPlacement, OptionProps } from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';

export interface AdvancedSelectOption {
    value: string
    label: string
    disabled?: boolean
    backgroundColor?: string
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
    small?: boolean
    disabled?: boolean
    defaultValue: string | string[]
    placeholder?: string
    menuPlacement?: MenuPlacement
    onChange: (options: string[]) => void
    onCreateOption?: (value: string) => void
    commands?: string[]
    containerStyle?: object
    style?: object
    width?: number
    title?: string
}

export default function AdvancedSelect(props: AdvancedSelectProps): React.JSX.Element {
    const {
        options, multi, small, disabled, defaultValue, placeholder, menuPlacement, commands, width, containerStyle, style, onChange, onCreateOption, title
    } = props;
    const { enableCommands, disableCommands } = useContext(EditorsContext) as EditorsContextType;

    const value: AdvancedSelectOption[] = [];
    options.map(o => {
        if (defaultValue && ((Array.isArray(defaultValue) && defaultValue.includes(o.value)) || defaultValue === o.value)) {
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

    const className = small
        ? 'react-select-container small'
        : 'react-select-container';

    const SelectType = onCreateOption ? CreatableSelect : Select;
    return <div title={title ?? undefined} style={containerStyle}>
        <SelectType
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
            className={className}
            classNamePrefix="react-select"
            maxMenuHeight={212}
            menuPlacement={menuPlacement}
            onFocus={handleOnFocus}
            onBlur={handleOnBlur}
            styles={{
                container: styles => ({
                    ...styles,
                    ...(style ?? {})
                }),
                control: styles => ({
                    ...styles,
                    width,
                }),
                option: (styles, { data, isDisabled, isFocused, isSelected }) => {
                    const backgroundColor = chroma(data.backgroundColor ?? '#000');
                    return {
                        ...styles,
                        backgroundColor: !data.backgroundColor
                            ? undefined
                            : isSelected || isFocused || isDisabled
                                ? data.backgroundColor
                                : backgroundColor.darken(0.25).css(),
                        color: !data.backgroundColor
                            ? undefined
                            : chroma.contrast(backgroundColor, 'white') > 2
                                ? 'white'
                                : 'black',
                    };
                },
            }}
        />
    </div>;
}
