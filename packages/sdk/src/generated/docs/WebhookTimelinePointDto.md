
# WebhookTimelinePointDto


## Properties

Name | Type
------------ | -------------
`timestamp` | string
`total` | number
`processed` | number
`failed` | number
`invalidSig` | number

## Example

```typescript
import type { WebhookTimelinePointDto } from ''

// TODO: Update the object below with actual values
const example = {
  "timestamp": 2026-01-14T10:00:00.000Z,
  "total": 50,
  "processed": 45,
  "failed": 3,
  "invalidSig": 2,
} satisfies WebhookTimelinePointDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WebhookTimelinePointDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


