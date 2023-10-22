import React from 'react';

interface EditorColumnProps {
    index: number
    brightness: number
    setValue: (index: number, value: number) => void
}

export default function EditorColumn(props: EditorColumnProps): React.JSX.Element {
    const { index, brightness, setValue } = props;

    const handleSelectInput = (event: React.MouseEvent) => // @ts-ignore
        event.target.select();

    const onMouse = (e: React.MouseEvent<HTMLElement>) => {
        if (e.buttons === 1) {
            // @ts-ignore
            const rect = e.target.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const max = 15;
            const step = rect.height / max;
            const value = Math.round(max - (y / step));
            setValue(index, value);
        }
    };

    return <div
        key={`editor-col-${index}`}
        className={`editor-col-${index}`}
    >
        <div className='index'>
            {index}
        </div>
        <div
            className={`bar brightness-${brightness}`}
            onMouseDown={onMouse}
            onMouseMoveCapture={onMouse}
        />
        <input
            className="theia-input"
            type="number"
            step="1"
            min={0}
            max={15}
            value={brightness}
            onClick={handleSelectInput}
            onChange={e => setValue(index, parseInt(e.target.value))}
        />
    </div>;
}
