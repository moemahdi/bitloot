
# AdminGrantCreditsDto


## Properties

Name | Type
------------ | -------------
`userId` | string
`amount` | number
`expiresInDays` | number
`reason` | string

## Example

```typescript
import type { AdminGrantCreditsDto } from ''

// TODO: Update the object below with actual values
const example = {
  "userId": null,
  "amount": 10,
  "expiresInDays": null,
  "reason": Customer goodwill - order issue,
} satisfies AdminGrantCreditsDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminGrantCreditsDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


