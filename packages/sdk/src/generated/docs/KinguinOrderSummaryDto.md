
# KinguinOrderSummaryDto


## Properties

Name | Type
------------ | -------------
`orderId` | string
`externalOrderId` | string
`products` | [Array&lt;OrderProductSummaryDto&gt;](OrderProductSummaryDto.md)
`paymentPrice` | number
`status` | string
`createdAt` | string

## Example

```typescript
import type { KinguinOrderSummaryDto } from ''

// TODO: Update the object below with actual values
const example = {
  "orderId": PHS84FJAG5U,
  "externalOrderId": BITLOOT-12345,
  "products": null,
  "paymentPrice": 5.29,
  "status": completed,
  "createdAt": 2026-01-14T10:30:00.000Z,
} satisfies KinguinOrderSummaryDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as KinguinOrderSummaryDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


