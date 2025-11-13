
# WebhookPayloadDto


## Properties

Name | Type
------------ | -------------
`reservationId` | string
`status` | string
`key` | string
`error` | string
`timestamp` | number

## Example

```typescript
import type { WebhookPayloadDto } from ''

// TODO: Update the object below with actual values
const example = {
  "reservationId": res-12345,
  "status": ready,
  "key": XXXXX-XXXXX-XXXXX-XXXXX,
  "error": Out of stock,
  "timestamp": 1730000000000,
} satisfies WebhookPayloadDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WebhookPayloadDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


