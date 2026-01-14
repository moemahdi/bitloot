
# KinguinBalanceDto


## Properties

Name | Type
------------ | -------------
`balance` | number
`currency` | string
`fetchedAt` | string
`apiConnected` | boolean
`environment` | string

## Example

```typescript
import type { KinguinBalanceDto } from ''

// TODO: Update the object below with actual values
const example = {
  "balance": 1234.56,
  "currency": null,
  "fetchedAt": 2026-01-14T10:30:00.000Z,
  "apiConnected": true,
  "environment": sandbox,
} satisfies KinguinBalanceDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as KinguinBalanceDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


