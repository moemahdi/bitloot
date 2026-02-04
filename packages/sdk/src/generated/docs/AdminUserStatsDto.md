
# AdminUserStatsDto


## Properties

Name | Type
------------ | -------------
`totalUsers` | number
`adminCount` | number
`newThisWeek` | number
`activeToday` | number
`suspendedCount` | number
`deletedCount` | number

## Example

```typescript
import type { AdminUserStatsDto } from ''

// TODO: Update the object below with actual values
const example = {
  "totalUsers": null,
  "adminCount": null,
  "newThisWeek": null,
  "activeToday": null,
  "suspendedCount": null,
  "deletedCount": null,
} satisfies AdminUserStatsDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminUserStatsDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


