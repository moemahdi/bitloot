
# AdminOpsControllerGetSystemHealth200Response


## Properties

Name | Type
------------ | -------------
`api` | [AdminOpsControllerGetSystemHealth200ResponseApi](AdminOpsControllerGetSystemHealth200ResponseApi.md)
`database` | [AdminOpsControllerGetSystemHealth200ResponseDatabase](AdminOpsControllerGetSystemHealth200ResponseDatabase.md)
`redis` | [AdminOpsControllerGetSystemHealth200ResponseDatabase](AdminOpsControllerGetSystemHealth200ResponseDatabase.md)
`queues` | [AdminOpsControllerGetSystemHealth200ResponseQueues](AdminOpsControllerGetSystemHealth200ResponseQueues.md)

## Example

```typescript
import type { AdminOpsControllerGetSystemHealth200Response } from ''

// TODO: Update the object below with actual values
const example = {
  "api": null,
  "database": null,
  "redis": null,
  "queues": null,
} satisfies AdminOpsControllerGetSystemHealth200Response

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminOpsControllerGetSystemHealth200Response
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


