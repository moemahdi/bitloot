
# AdminOpsControllerGetFailedJobs200ResponseJobsInner


## Properties

Name | Type
------------ | -------------
`id` | string
`name` | string
`data` | object
`failedReason` | string
`stacktrace` | Array&lt;string&gt;
`attemptsMade` | number
`maxAttempts` | number
`timestamp` | number
`processedOn` | number
`finishedOn` | number

## Example

```typescript
import type { AdminOpsControllerGetFailedJobs200ResponseJobsInner } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "name": null,
  "data": null,
  "failedReason": null,
  "stacktrace": null,
  "attemptsMade": null,
  "maxAttempts": null,
  "timestamp": null,
  "processedOn": null,
  "finishedOn": null,
} satisfies AdminOpsControllerGetFailedJobs200ResponseJobsInner

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminOpsControllerGetFailedJobs200ResponseJobsInner
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


