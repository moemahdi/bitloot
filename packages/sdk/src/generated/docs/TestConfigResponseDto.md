
# TestConfigResponseDto


## Properties

Name | Type
------------ | -------------
`provider` | string
`environment` | string
`success` | boolean
`message` | string
`responseTimeMs` | number
`details` | object

## Example

```typescript
import type { TestConfigResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "provider": null,
  "environment": null,
  "success": null,
  "message": null,
  "responseTimeMs": null,
  "details": null,
} satisfies TestConfigResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as TestConfigResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


