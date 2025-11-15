
# UnsubscribeEmailDto


## Properties

Name | Type
------------ | -------------
`email` | string
`token` | string

## Example

```typescript
import type { UnsubscribeEmailDto } from ''

// TODO: Update the object below with actual values
const example = {
  "email": user@example.com,
  "token": 550e8400-e29b-41d4-a716-446655440000,
} satisfies UnsubscribeEmailDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UnsubscribeEmailDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


