
# KinguinHealthDto


## Properties

Name | Type
------------ | -------------
`healthy` | boolean
`responseTimeMs` | number
`environment` | string
`checkedAt` | string

## Example

```typescript
import type { KinguinHealthDto } from ''

// TODO: Update the object below with actual values
const example = {
  "healthy": true,
  "responseTimeMs": 125,
  "environment": null,
  "checkedAt": null,
} satisfies KinguinHealthDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as KinguinHealthDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


