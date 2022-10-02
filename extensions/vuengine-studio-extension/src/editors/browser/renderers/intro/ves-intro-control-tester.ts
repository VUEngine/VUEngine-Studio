import { rankWith, scopeEndsWith } from '@jsonforms/core';

export default rankWith(
    3,
    scopeEndsWith('#/properties/typeId')
);
