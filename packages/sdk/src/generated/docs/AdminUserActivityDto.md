
# AdminUserActivityDto


## Properties

Name | Type
------------ | -------------
`id` | string
`action` | string
`target` | object
`details` | object
`createdAt` | Date

## Example

```typescript
import type { AdminUserActivityDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "action": null,
  "target": null,
  "details": null,
  "createdAt": null,
} satisfies AdminUserActivityDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminUserActivityDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


