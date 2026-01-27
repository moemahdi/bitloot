
# SyncJobStatusResponseDtoResult

Job result data (available after completion)

## Properties

Name | Type
------------ | -------------
`productsProcessed` | number
`productsCreated` | number
`productsUpdated` | number
`productsSkipped` | number
`errors` | Array&lt;string&gt;
`skippedProducts` | [Array&lt;SkippedProductInfoDto&gt;](SkippedProductInfoDto.md)
`updatedProducts` | [Array&lt;UpdatedProductInfoDto&gt;](UpdatedProductInfoDto.md)

## Example

```typescript
import type { SyncJobStatusResponseDtoResult } from ''

// TODO: Update the object below with actual values
const example = {
  "productsProcessed": null,
  "productsCreated": null,
  "productsUpdated": null,
  "productsSkipped": null,
  "errors": null,
  "skippedProducts": null,
  "updatedProducts": null,
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


