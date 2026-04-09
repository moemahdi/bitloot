
# CreditBalanceDto


## Properties

Name | Type
------------ | -------------
`cash` | string
`promo` | string
`total` | string
`expiringWithin30Days` | string

## Example

```typescript
import type { CreditBalanceDto } from ''

// TODO: Update the object below with actual values
const example = {
  "cash": 30.00000000,
  "promo": 15.50000000,
  "total": 45.50000000,
  "expiringWithin30Days": 10.00000000,
} satisfies CreditBalanceDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreditBalanceDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


