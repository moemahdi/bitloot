
# NowpaymentsIpnRequestDto


## Properties

Name | Type
------------ | -------------
`paymentId` | string
`invoiceId` | string
`orderId` | string
`paymentStatus` | string
`priceAmount` | number
`priceCurrency` | string
`payAmount` | number
`payCurrency` | string
`receivedAmount` | number
`receivedCurrency` | string
`createdAt` | string
`updatedAt` | string
`reference` | string

## Example

```typescript
import type { NowpaymentsIpnRequestDto } from ''

// TODO: Update the object below with actual values
const example = {
  "paymentId": 123456789,
  "invoiceId": 550e8400-e29b-41d4-a716-446655440000,
  "orderId": 550e8400-e29b-41d4-a716-446655440000,
  "paymentStatus": finished,
  "priceAmount": 100,
  "priceCurrency": eur,
  "payAmount": 0.0025,
  "payCurrency": btc,
  "receivedAmount": 0.0025,
  "receivedCurrency": btc,
  "createdAt": 2025-11-08T15:30:00Z,
  "updatedAt": 2025-11-08T15:35:00Z,
  "reference": null,
} satisfies NowpaymentsIpnRequestDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as NowpaymentsIpnRequestDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


