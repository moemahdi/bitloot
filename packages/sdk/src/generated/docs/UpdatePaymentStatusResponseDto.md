
# UpdatePaymentStatusResponseDto


## Properties

Name | Type
------------ | -------------
`success` | boolean
`paymentId` | string
`previousStatus` | string
`newStatus` | string
`changedBy` | string
`changedAt` | Date

## Example

```typescript
import type { UpdatePaymentStatusResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "success": null,
  "paymentId": null,
  "previousStatus": null,
  "newStatus": null,
  "changedBy": null,
  "changedAt": null,
} satisfies UpdatePaymentStatusResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UpdatePaymentStatusResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


