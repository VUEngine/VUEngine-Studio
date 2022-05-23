import { isIntegerControl, isOneOfControl, or, rankWith } from '@jsonforms/core';

export default rankWith(
    3,
    or(
        isIntegerControl,
        isOneOfControl
    )
);
