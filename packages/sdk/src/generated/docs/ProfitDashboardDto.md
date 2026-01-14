
# ProfitDashboardDto


## Properties

Name | Type
------------ | -------------
`summaryTotal` | [ProfitSummaryDto](ProfitSummaryDto.md)
`summary24h` | [ProfitSummaryDto](ProfitSummaryDto.md)
`summary7d` | [ProfitSummaryDto](ProfitSummaryDto.md)
`summary30d` | [ProfitSummaryDto](ProfitSummaryDto.md)
`topProducts` | [Array&lt;ProductProfitDto&gt;](ProductProfitDto.md)
`lowMarginProducts` | [Array&lt;ProductProfitDto&gt;](ProductProfitDto.md)
`profitTrend` | [Array&lt;ProfitTrendPointDto&gt;](ProfitTrendPointDto.md)
`marginDistribution` | [Array&lt;MarginDistributionBucketDto&gt;](MarginDistributionBucketDto.md)
`alerts` | [Array&lt;ProfitAlertDto&gt;](ProfitAlertDto.md)
`fetchedAt` | string

## Example

```typescript
import type { ProfitDashboardDto } from ''

// TODO: Update the object below with actual values
const example = {
  "summaryTotal": null,
  "summary24h": null,
  "summary7d": null,
  "summary30d": null,
  "topProducts": null,
  "lowMarginProducts": null,
  "profitTrend": null,
  "marginDistribution": null,
  "alerts": null,
  "fetchedAt": null,
} satisfies ProfitDashboardDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ProfitDashboardDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


