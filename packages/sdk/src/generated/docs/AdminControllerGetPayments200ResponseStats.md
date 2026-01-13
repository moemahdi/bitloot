
# AdminControllerGetPayments200ResponseStats

Aggregate statistics for all payments (ignores pagination)

## Properties

Name | Type
------------ | -------------
`totalPayments` | number
`successfulPayments` | number
`failedPayments` | number
`pendingPayments` | number
`totalRevenue` | string
`successRate` | number

## Example

```typescript
import type { AdminControllerGetPayments200ResponseStats } from ''

// TODO: Update the object below with actual values
const example = {
  "totalPayments": null,
  "successfulPayments": null,
  "failedPayments": null,
  "pendingPayments": null,
  "totalRevenue": null,
  "successRate": null,
} satisfies AdminControllerGetPayments200ResponseStats

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminControllerGetPayments200ResponseStats
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


