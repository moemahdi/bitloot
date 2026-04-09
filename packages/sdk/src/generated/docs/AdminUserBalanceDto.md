
# AdminUserBalanceDto


## Properties

Name | Type
------------ | -------------
`userId` | string
`email` | string
`cashBalance` | string
`promoBalance` | string
`totalSpent` | string
`createdAt` | string

## Example

```typescript
import type { AdminUserBalanceDto } from ''

// TODO: Update the object below with actual values
const example = {
  "userId": null,
  "email": null,
  "cashBalance": null,
  "promoBalance": null,
  "totalSpent": null,
  "createdAt": null,
} satisfies AdminUserBalanceDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminUserBalanceDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


