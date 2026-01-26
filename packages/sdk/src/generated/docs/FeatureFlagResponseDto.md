
# FeatureFlagResponseDto


## Properties

Name | Type
------------ | -------------
`id` | string
`name` | string
`enabled` | boolean
`description` | string
`category` | string
`createdAt` | Date
`updatedAt` | Date
`updatedById` | string
`updatedByEmail` | string

## Example

```typescript
import type { FeatureFlagResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "name": null,
  "enabled": null,
  "description": null,
  "category": null,
  "createdAt": null,
  "updatedAt": null,
  "updatedById": null,
  "updatedByEmail": null,
} satisfies FeatureFlagResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as FeatureFlagResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


