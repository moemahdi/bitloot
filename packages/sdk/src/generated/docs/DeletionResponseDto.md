
# DeletionResponseDto


## Properties

Name | Type
------------ | -------------
`success` | boolean
`message` | string
`deletionDate` | object
`daysRemaining` | object

## Example

```typescript
import type { DeletionResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "success": null,
  "message": null,
  "deletionDate": null,
  "daysRemaining": null,
} satisfies DeletionResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as DeletionResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


