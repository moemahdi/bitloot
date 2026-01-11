
# RecoveryItemDto


## Properties

Name | Type
------------ | -------------
`itemId` | string
`signedUrl` | object

## Example

```typescript
import type { RecoveryItemDto } from ''

// TODO: Update the object below with actual values
const example = {
  "itemId": uuid-string,
  "signedUrl": https://signed-url-to-key.com,
} satisfies RecoveryItemDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as RecoveryItemDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


