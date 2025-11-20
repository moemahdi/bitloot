
# DashboardStatsDto


## Properties

Name | Type
------------ | -------------
`totalRevenue` | number
`totalOrders` | number
`totalUsers` | number
`activeOrders` | number
`revenueHistory` | [Array&lt;DashboardStatsDtoRevenueHistoryInner&gt;](DashboardStatsDtoRevenueHistoryInner.md)

## Example

```typescript
import type { DashboardStatsDto } from ''

// TODO: Update the object below with actual values
const example = {
  "totalRevenue": 125000,
  "totalOrders": 150,
  "totalUsers": 85,
  "activeOrders": 12,
  "revenueHistory": null,
} satisfies DashboardStatsDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as DashboardStatsDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


