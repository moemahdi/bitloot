
# NowpaymentsIpnResponseDto


## Properties

Name | Type
------------ | -------------
`ok` | boolean
`message` | string
`processed` | boolean
`webhookId` | string

## Example

```typescript
import type { NowpaymentsIpnResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "ok": true,
  "message": Webhook received and processed,
  "processed": true,
  "webhookId": 550e8400-e29b-41d4-a716-446655440000,
} satisfies NowpaymentsIpnResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as NowpaymentsIpnResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


