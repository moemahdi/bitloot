
# HealthCheckResultDto


## Properties

Name | Type
------------ | -------------
`service` | string
`status` | string
`dependencies` | object
`timestamp` | Date
`error` | string

## Example

```typescript
import type { HealthCheckResultDto } from ''

// TODO: Update the object below with actual values
const example = {
  "service": FulfillmentService,
  "status": healthy,
  "dependencies": {"r2Storage":true},
  "timestamp": 2025-11-08T14:00Z,
  "error": R2 storage connection timeout,
} satisfies HealthCheckResultDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as HealthCheckResultDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


