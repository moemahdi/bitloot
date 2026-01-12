
# BulkUpdateStatusDto


## Properties

Name | Type
------------ | -------------
`orderIds` | Array&lt;string&gt;
`status` | string
`reason` | string

## Example

```typescript
import type { BulkUpdateStatusDto } from ''

// TODO: Update the object below with actual values
const example = {
  "orderIds": ["uuid-1","uuid-2","uuid-3"],
  "status": fulfilled,
  "reason": Bulk processing - manual verification complete,
} satisfies BulkUpdateStatusDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as BulkUpdateStatusDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


