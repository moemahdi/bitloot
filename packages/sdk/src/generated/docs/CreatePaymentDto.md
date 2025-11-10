
# CreatePaymentDto


## Properties

Name | Type
------------ | -------------
`orderId` | string
`email` | string
`priceAmount` | string
`priceCurrency` | string
`payCurrency` | string

## Example

```typescript
import type { CreatePaymentDto } from ''

// TODO: Update the object below with actual values
const example = {
  "orderId": 550e8400-e29b-41d4-a716-446655440000,
  "email": customer@example.com,
  "priceAmount": 49.99,
  "priceCurrency": usd,
  "payCurrency": btc,
} satisfies CreatePaymentDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreatePaymentDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


