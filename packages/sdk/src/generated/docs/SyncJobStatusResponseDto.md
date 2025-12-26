
# SyncJobStatusResponseDto


## Properties

Name | Type
------------ | -------------
`jobId` | string
`status` | string
`progress` | number
`result` | [SyncJobStatusResponseDtoResult](SyncJobStatusResponseDtoResult.md)
`failedReason` | string
`createdAt` | Date
`processedOn` | Date
`finishedOn` | Date

## Example

```typescript
import type { SyncJobStatusResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "jobId": null,
  "status": null,
  "progress": null,
  "result": null,
  "failedReason": null,
  "createdAt": null,
  "processedOn": null,
  "finishedOn": null,
} satisfies SyncJobStatusResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SyncJobStatusResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


