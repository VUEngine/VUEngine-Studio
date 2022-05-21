import { or, rankWith, scopeEndsWith } from '@jsonforms/core';

export default rankWith(
    3,
    or(
        scopeEndsWith('Palette0'),
        scopeEndsWith('Palette1'),
        scopeEndsWith('Palette2'),
        scopeEndsWith('Palette3')
    )
);
