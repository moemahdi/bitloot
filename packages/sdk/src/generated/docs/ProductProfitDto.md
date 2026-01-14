
# ProductProfitDto


## Properties

Name | Type
------------ | -------------
`productName` | string
`productId` | string
`unitsSold` | number
`totalRevenue` | number
`totalCost` | number
`totalProfit` | number
`marginPercent` | number
`avgSellPrice` | number
`avgCostPrice` | number
`avgProfitPerUnit` | number

## Example

```typescript
import type { ProductProfitDto } from ''

// TODO: Update the object below with actual values
const example = {
  "productName": null,
  "productId": null,
  "unitsSold": null,
  "totalRevenue": null,
  "totalCost": null,
  "totalProfit": null,
  "marginPercent": null,
  "avgSellPrice": null,
  "avgCostPrice": null,
  "avgProfitPerUnit": null,
} satisfies ProductProfitDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ProductProfitDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


