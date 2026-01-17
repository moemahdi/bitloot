
# ValidatePromoDto


## Properties

Name | Type
------------ | -------------
`code` | string
`orderTotal` | string
`productIds` | Array&lt;string&gt;
`categoryIds` | Array&lt;string&gt;
`userId` | string
`email` | string
`appliedPromoCodeIds` | Array&lt;string&gt;

## Example

```typescript
import type { ValidatePromoDto } from ''

// TODO: Update the object below with actual values
const example = {
  "code": SAVE10,
  "orderTotal": 49.99,
  "productIds": null,
  "categoryIds": null,
  "userId": null,
  "email": null,
  "appliedPromoCodeIds": null,
} satisfies ValidatePromoDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ValidatePromoDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


