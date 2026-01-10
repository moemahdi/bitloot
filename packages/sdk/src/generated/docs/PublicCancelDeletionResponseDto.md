
# PublicCancelDeletionResponseDto


## Properties

Name | Type
------------ | -------------
`status` | string
`message` | string
`email` | string
`cancelledAt` | string

## Example

```typescript
import type { PublicCancelDeletionResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "status": success,
  "message": null,
  "email": null,
  "cancelledAt": null,
} satisfies PublicCancelDeletionResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PublicCancelDeletionResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


