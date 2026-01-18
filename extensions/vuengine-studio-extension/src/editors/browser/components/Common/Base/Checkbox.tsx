import React, { ReactElement, useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import InfoLabel from '../InfoLabel';
import VContainer from './VContainer';

interface CheckboxProps {
    checked: boolean
    setChecked?: (checked: boolean) => void
    label?: string
    tooltip?: string | ReactElement
    sideLabel?: string | ReactElement
    disabled?: boolean
}

export default function Checkbox(props: CheckboxProps): React.JSX.Element {
    const {
        checked, setChecked,
        label, tooltip,
        sideLabel,
        disabled,
    } = props;
    const { enableCommands, disableCommands } = useContext(EditorsContext) as EditorsContextType;

    const handleOnFocus = () => {
        if (disableCommands) {
            disableCommands();
        }
    };

    const handleOnBlur = () => {
        if (enableCommands) {
            enableCommands();
        }
    };

    return (
        <VContainer>
            {label !== undefined &&
                <InfoLabel
                    label={label}
                    tooltip={tooltip}
                />
            }
            <label>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => {
                        if (setChecked !== undefined) {
                            setChecked(e.target.checked);
                        }
                    }}
                    onFocus={handleOnFocus}
                    onBlur={handleOnBlur}
                    disabled={disabled}
                />
                {sideLabel}
            </label>
        </VContainer>
    );
}
