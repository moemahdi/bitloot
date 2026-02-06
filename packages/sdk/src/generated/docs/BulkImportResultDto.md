
# BulkImportResultDto


## Properties

Name | Type
------------ | -------------
`imported` | number
`skippedDuplicates` | number
`failed` | number
`errors` | Array&lt;string&gt;

## Example

```typescript
import type { BulkImportResultDto } from ''

// TODO: Update the object below with actual values
const example = {
  "imported": null,
  "skippedDuplicates": null,
  "failed": null,
  "errors": null,
} satisfies BulkImportResultDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as BulkImportResultDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


