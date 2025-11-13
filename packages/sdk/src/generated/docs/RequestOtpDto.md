
# RequestOtpDto


## Properties

Name | Type
------------ | -------------
`email` | string
`captchaToken` | string

## Example

```typescript
import type { RequestOtpDto } from ''

// TODO: Update the object below with actual values
const example = {
  "email": user@example.com,
  "captchaToken": 0x4AAAAAABkpwy8Y38VB-QW9...,
} satisfies RequestOtpDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as RequestOtpDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


