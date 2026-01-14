
# ProfitTrendPointDto


## Properties

Name | Type
------------ | -------------
`date` | string
`revenue` | number
`cost` | number
`profit` | number
`marginPercent` | number
`orderCount` | number

## Example

```typescript
import type { ProfitTrendPointDto } from ''

// TODO: Update the object below with actual values
const example = {
  "date": null,
  "revenue": null,
  "cost": null,
  "profit": null,
  "marginPercent": null,
  "orderCount": null,
} satisfies ProfitTrendPointDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ProfitTrendPointDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


