
# OtpResponseDto


## Properties

Name | Type
------------ | -------------
`success` | boolean
`expiresIn` | number
`error` | string

## Example

```typescript
import type { OtpResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "success": true,
  "expiresIn": 300,
  "error": null,
} satisfies OtpResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as OtpResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


