
# AdminPendingTopupDto


## Properties

Name | Type
------------ | -------------
`id` | string
`userId` | string
`amountEur` | string
`npPaymentId` | string
`status` | string
`createdAt` | string

## Example

```typescript
import type { AdminPendingTopupDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "userId": null,
  "amountEur": null,
  "npPaymentId": null,
  "status": null,
  "createdAt": null,
} satisfies AdminPendingTopupDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminPendingTopupDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


