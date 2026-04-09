
# AdminUserTransactionDto


## Properties

Name | Type
------------ | -------------
`id` | string
`type` | string
`creditType` | string
`amount` | string
`balanceAfter` | string
`description` | string
`createdAt` | string

## Example

```typescript
import type { AdminUserTransactionDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "type": null,
  "creditType": null,
  "amount": null,
  "balanceAfter": null,
  "description": null,
  "createdAt": null,
} satisfies AdminUserTransactionDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminUserTransactionDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


