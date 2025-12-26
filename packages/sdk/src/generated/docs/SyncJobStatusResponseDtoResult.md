
# SyncJobStatusResponseDtoResult

Job result data

## Properties

Name | Type
------------ | -------------
`productsProcessed` | number
`productsCreated` | number
`productsUpdated` | number
`errors` | Array&lt;string&gt;

## Example

```typescript
import type { SyncJobStatusResponseDtoResult } from ''

// TODO: Update the object below with actual values
const example = {
  "productsProcessed": null,
  "productsCreated": null,
  "productsUpdated": null,
  "errors": null,
} satisfies SyncJobStatusResponseDtoResult

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SyncJobStatusResponseDtoResult
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


