
# CreateAdminUserDto


## Properties

Name | Type
------------ | -------------
`email` | string
`role` | string
`sendWelcomeEmail` | boolean

## Example

```typescript
import type { CreateAdminUserDto } from ''

// TODO: Update the object below with actual values
const example = {
  "email": null,
  "role": null,
  "sendWelcomeEmail": null,
} satisfies CreateAdminUserDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreateAdminUserDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


