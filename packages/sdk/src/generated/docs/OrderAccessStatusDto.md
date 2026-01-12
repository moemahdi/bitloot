
# OrderAccessStatusDto


## Properties

Name | Type
------------ | -------------
`canAccess` | boolean
`reason` | string
`isAuthenticated` | boolean
`isFulfilled` | boolean
`message` | string

## Example

```typescript
import type { OrderAccessStatusDto } from ''

// TODO: Update the object below with actual values
const example = {
  "canAccess": null,
  "reason": owner,
  "isAuthenticated": null,
  "isFulfilled": null,
  "message": You own this order,
} satisfies OrderAccessStatusDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as OrderAccessStatusDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


