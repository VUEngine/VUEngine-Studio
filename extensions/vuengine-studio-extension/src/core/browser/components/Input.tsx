import React from 'react';

interface InputProps {
    label?: string;
}

/*
    display: flex;
    flex-direction: column;
    gap: 6px;
*/

const Input = (props: InputProps) => (<div>
    {props.label}
    <input className='theia-input' />
</div>);

export default Input;
