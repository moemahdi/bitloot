
# AdminUserSessionDto


## Properties

Name | Type
------------ | -------------
`id` | string
`deviceInfo` | object
`ipAddress` | object
`location` | object
`isRevoked` | boolean
`lastActiveAt` | object
`createdAt` | Date
`expiresAt` | Date

## Example

```typescript
import type { AdminUserSessionDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "deviceInfo": null,
  "ipAddress": null,
  "location": null,
  "isRevoked": null,
  "lastActiveAt": null,
  "createdAt": null,
  "expiresAt": null,
} satisfies AdminUserSessionDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminUserSessionDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


