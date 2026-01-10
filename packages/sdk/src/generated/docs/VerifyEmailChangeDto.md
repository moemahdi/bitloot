
# VerifyEmailChangeDto


## Properties

Name | Type
------------ | -------------
`oldEmailCode` | string
`newEmailCode` | string

## Example

```typescript
import type { VerifyEmailChangeDto } from ''

// TODO: Update the object below with actual values
const example = {
  "oldEmailCode": 123456,
  "newEmailCode": 654321,
} satisfies VerifyEmailChangeDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as VerifyEmailChangeDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


