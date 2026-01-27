
# SyncHistoryResponseDto


## Properties

Name | Type
------------ | -------------
`jobs` | [Array&lt;SyncJobStatusResponseDto&gt;](SyncJobStatusResponseDto.md)
`total` | number

## Example

```typescript
import type { SyncHistoryResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "jobs": null,
  "total": null,
} satisfies SyncHistoryResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SyncHistoryResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


