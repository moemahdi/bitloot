
# ProfitSummaryDto


## Properties

Name | Type
------------ | -------------
`totalRevenue` | number
`totalCost` | number
`grossProfit` | number
`profitMarginPercent` | number
`orderCount` | number
`avgProfitPerOrder` | number
`avgRevenuePerOrder` | number
`avgCostPerOrder` | number
`roiPercent` | number
`period` | string
`fetchedAt` | string

## Example

```typescript
import type { ProfitSummaryDto } from ''

// TODO: Update the object below with actual values
const example = {
  "totalRevenue": null,
  "totalCost": null,
  "grossProfit": null,
  "profitMarginPercent": null,
  "orderCount": null,
  "avgProfitPerOrder": null,
  "avgRevenuePerOrder": null,
  "avgCostPerOrder": null,
  "roiPercent": null,
  "period": null,
  "fetchedAt": null,
} satisfies ProfitSummaryDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ProfitSummaryDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


