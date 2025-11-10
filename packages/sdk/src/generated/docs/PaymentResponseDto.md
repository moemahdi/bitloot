
# PaymentResponseDto


## Properties

Name | Type
------------ | -------------
`invoiceId` | number
`invoiceUrl` | string
`statusUrl` | string
`payAddress` | string
`priceAmount` | number
`payAmount` | number
`payCurrency` | string
`status` | string
`expirationDate` | string

## Example

```typescript
import type { PaymentResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "invoiceId": 123456,
  "invoiceUrl": https://nowpayments.io/invoice/...,
  "statusUrl": https://nowpayments.io/status/...,
  "payAddress": bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh,
  "priceAmount": 49.99,
  "payAmount": 0.001234,
  "payCurrency": btc,
  "status": waiting,
  "expirationDate": 2025-11-08T23:59:59Z,
} satisfies PaymentResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PaymentResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


