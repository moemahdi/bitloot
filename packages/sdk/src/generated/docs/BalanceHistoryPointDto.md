
# BalanceHistoryPointDto


## Properties

Name | Type
------------ | -------------
`date` | string
`balance` | number
`spending` | number

## Example

```typescript
import type { BalanceHistoryPointDto } from ''

// TODO: Update the object below with actual values
const example = {
  "date": 2026-01-14,
  "balance": 1500,
  "spending": 45.23,
} satisfies BalanceHistoryPointDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as BalanceHistoryPointDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


