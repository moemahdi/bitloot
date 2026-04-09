
# TopupStatusResponseDto


## Properties

Name | Type
------------ | -------------
`topupId` | string
`amountEur` | number
`status` | string
`paymentStatus` | string
`npPaymentId` | string
`payCurrency` | string
`actuallyPaid` | number
`payAmount` | number
`confirmedAt` | string

## Example

```typescript
import type { TopupStatusResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "topupId": null,
  "amountEur": null,
  "status": null,
  "paymentStatus": null,
  "npPaymentId": null,
  "payCurrency": null,
  "actuallyPaid": null,
  "payAmount": null,
  "confirmedAt": null,
} satisfies TopupStatusResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as TopupStatusResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


