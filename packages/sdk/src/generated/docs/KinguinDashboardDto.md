
# KinguinDashboardDto


## Properties

Name | Type
------------ | -------------
`balance` | [KinguinBalanceDto](KinguinBalanceDto.md)
`spending24h` | [SpendingStatsDto](SpendingStatsDto.md)
`spending7d` | [SpendingStatsDto](SpendingStatsDto.md)
`spending30d` | [SpendingStatsDto](SpendingStatsDto.md)
`recentOrders` | [Array&lt;KinguinOrderSummaryDto&gt;](KinguinOrderSummaryDto.md)
`alerts` | [Array&lt;BalanceAlertDto&gt;](BalanceAlertDto.md)
`runwayDays` | number

## Example

```typescript
import type { KinguinDashboardDto } from ''

// TODO: Update the object below with actual values
const example = {
  "balance": null,
  "spending24h": null,
  "spending7d": null,
  "spending30d": null,
  "recentOrders": null,
  "alerts": null,
  "runwayDays": 27,
} satisfies KinguinDashboardDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as KinguinDashboardDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


