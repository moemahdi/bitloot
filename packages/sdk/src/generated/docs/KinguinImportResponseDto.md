
# KinguinImportResponseDto


## Properties

Name | Type
------------ | -------------
`success` | boolean
`productId` | string
`title` | string
`message` | string
`isNew` | boolean

## Example

```typescript
import type { KinguinImportResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "success": true,
  "productId": abc123-def456-ghi789,
  "title": Cyberpunk 2077,
  "message": Successfully imported "Cyberpunk 2077" from Kinguin,
  "isNew": true,
} satisfies KinguinImportResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as KinguinImportResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


