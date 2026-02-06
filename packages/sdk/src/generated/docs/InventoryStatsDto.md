
# InventoryStatsDto


## Properties

Name | Type
------------ | -------------
`total` | number
`available` | number
`reserved` | number
`sold` | number
`expired` | number
`invalid` | number
`totalCost` | number
`avgCost` | number
`totalRevenue` | number
`totalProfit` | number

## Example

```typescript
import type { InventoryStatsDto } from ''

// TODO: Update the object below with actual values
const example = {
  "total": null,
  "available": null,
  "reserved": null,
  "sold": null,
  "expired": null,
  "invalid": null,
  "totalCost": null,
  "avgCost": null,
  "totalRevenue": null,
  "totalProfit": null,
} satisfies InventoryStatsDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as InventoryStatsDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


