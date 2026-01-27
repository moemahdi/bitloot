
# SyncJobStatusResponseDtoProgressData

Detailed progress data with live stats

## Properties

Name | Type
------------ | -------------
`percent` | number
`current` | number
`total` | number
`updated` | number
`skipped` | number
`errors` | number

## Example

```typescript
import type { SyncJobStatusResponseDtoProgressData } from ''

// TODO: Update the object below with actual values
const example = {
  "percent": null,
  "current": null,
  "total": null,
  "updated": null,
  "skipped": null,
  "errors": null,
} satisfies SyncJobStatusResponseDtoProgressData

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SyncJobStatusResponseDtoProgressData
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


