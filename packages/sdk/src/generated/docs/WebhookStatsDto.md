
# WebhookStatsDto


## Properties

Name | Type
------------ | -------------
`total` | number
`processed` | number
`pending` | number
`failed` | number
`invalidSignature` | number
`duplicates` | number
`successRate` | number
`byType` | [Array&lt;WebhookStatsByTypeDto&gt;](WebhookStatsByTypeDto.md)
`byStatus` | [Array&lt;WebhookStatsByStatusDto&gt;](WebhookStatsByStatusDto.md)
`periodStart` | string
`periodEnd` | string

## Example

```typescript
import type { WebhookStatsDto } from ''

// TODO: Update the object below with actual values
const example = {
  "total": 500,
  "processed": 450,
  "pending": 25,
  "failed": 15,
  "invalidSignature": 5,
  "duplicates": 5,
  "successRate": 90.5,
  "byType": null,
  "byStatus": null,
  "periodStart": 2026-01-07T00:00:00.000Z,
  "periodEnd": 2026-01-14T23:59:59.999Z,
} satisfies WebhookStatsDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WebhookStatsDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


