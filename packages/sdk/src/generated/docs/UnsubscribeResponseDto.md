
# UnsubscribeResponseDto


## Properties

Name | Type
------------ | -------------
`status` | string
`message` | string
`email` | string
`unsubscribedAt` | Date

## Example

```typescript
import type { UnsubscribeResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "status": success,
  "message": You have been successfully unsubscribed from BitLoot emails,
  "email": user@example.com,
  "unsubscribedAt": 2025-11-12T14:32Z,
} satisfies UnsubscribeResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UnsubscribeResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


