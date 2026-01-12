
# OrderAnalyticsDto


## Properties

Name | Type
------------ | -------------
`byStatus` | [Array&lt;StatusCountDto&gt;](StatusCountDto.md)
`bySourceType` | [Array&lt;SourceTypeCountDto&gt;](SourceTypeCountDto.md)
`dailyVolume` | [Array&lt;DailyVolumeDto&gt;](DailyVolumeDto.md)
`averageOrderValue` | number
`totalOrders` | number
`totalRevenue` | number
`fulfillmentRate` | number
`failedRate` | number

## Example

```typescript
import type { OrderAnalyticsDto } from ''

// TODO: Update the object below with actual values
const example = {
  "byStatus": null,
  "bySourceType": null,
  "dailyVolume": null,
  "averageOrderValue": 29.99,
  "totalOrders": 158,
  "totalRevenue": 4538.42,
  "fulfillmentRate": 85.5,
  "failedRate": 2.3,
} satisfies OrderAnalyticsDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as OrderAnalyticsDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


