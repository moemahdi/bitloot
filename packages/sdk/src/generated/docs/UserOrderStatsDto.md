
# UserOrderStatsDto


## Properties

Name | Type
------------ | -------------
`totalOrders` | number
`completedOrders` | number
`pendingOrders` | number
`processingOrders` | number
`failedOrders` | number
`totalSpent` | string
`digitalDownloads` | number

## Example

```typescript
import type { UserOrderStatsDto } from ''

// TODO: Update the object below with actual values
const example = {
  "totalOrders": 151,
  "completedOrders": 66,
  "pendingOrders": 5,
  "processingOrders": 3,
  "failedOrders": 10,
  "totalSpent": 3243.11,
  "digitalDownloads": 40,
} satisfies UserOrderStatsDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UserOrderStatsDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


