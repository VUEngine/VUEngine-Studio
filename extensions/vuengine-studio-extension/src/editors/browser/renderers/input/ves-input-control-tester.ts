import { isIntegerControl, isOneOfControl, or, rankWith, scopeEndsWith } from '@jsonforms/core';

export default rankWith(
    3,
    or(
        isIntegerControl,
        isOneOfControl,
        scopeEndsWith('/folder')
    )
);