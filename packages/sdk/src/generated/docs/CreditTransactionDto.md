
# CreditTransactionDto


## Properties

Name | Type
------------ | -------------
`id` | string
`type` | string
`creditType` | string
`amount` | string
`balanceAfter` | string
`referenceType` | object
`referenceId` | object
`description` | object
`expiresAt` | object
`createdAt` | Date

## Example

```typescript
import type { CreditTransactionDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "type": null,
  "creditType": null,
  "amount": 5.00000000,
  "balanceAfter": 15.50000000,
  "referenceType": null,
  "referenceId": null,
  "description": null,
  "expiresAt": null,
  "createdAt": null,
} satisfies CreditTransactionDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreditTransactionDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


