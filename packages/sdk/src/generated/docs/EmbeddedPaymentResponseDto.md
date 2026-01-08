
# EmbeddedPaymentResponseDto


## Properties

Name | Type
------------ | -------------
`paymentId` | string
`externalId` | string
`orderId` | string
`payAddress` | string
`payAmount` | number
`payCurrency` | string
`priceAmount` | number
`priceCurrency` | string
`status` | string
`expiresAt` | string
`qrCodeData` | string
`estimatedTime` | string

## Example

```typescript
import type { EmbeddedPaymentResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "paymentId": 550e8400-e29b-41d4-a716-446655440000,
  "externalId": 839217,
  "orderId": 550e8400-e29b-41d4-a716-446655440000,
  "payAddress": bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh,
  "payAmount": 0.001234,
  "payCurrency": btc,
  "priceAmount": 49.99,
  "priceCurrency": eur,
  "status": waiting,
  "expiresAt": 2025-01-08T23:59:59Z,
  "qrCodeData": bitcoin:bc1qxy2...?amount=0.001234,
  "estimatedTime": 10-30 minutes,
} satisfies EmbeddedPaymentResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EmbeddedPaymentResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


