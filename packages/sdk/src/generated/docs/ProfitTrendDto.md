
# ProfitTrendDto


## Properties

Name | Type
------------ | -------------
`trend` | [Array&lt;ProfitTrendPointDto&gt;](ProfitTrendPointDto.md)
`days` | number
`totalRevenue` | number
`totalCost` | number
`totalProfit` | number
`avgDailyProfit` | number
`bestDayProfit` | number
`bestDayDate` | string

## Example

```typescript
import type { ProfitTrendDto } from ''

// TODO: Update the object below with actual values
const example = {
  "trend": null,
  "days": null,
  "totalRevenue": null,
  "totalCost": null,
  "totalProfit": null,
  "avgDailyProfit": null,
  "bestDayProfit": null,
  "bestDayDate": null,
} satisfies ProfitTrendDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ProfitTrendDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


