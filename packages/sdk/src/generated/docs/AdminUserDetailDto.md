
# AdminUserDetailDto


## Properties

Name | Type
------------ | -------------
`id` | string
`email` | string
`role` | string
`emailConfirmed` | boolean
`pendingEmail` | object
`isSuspended` | boolean
`suspendedAt` | object
`suspendedReason` | object
`isDeleted` | boolean
`deletedAt` | object
`deletionRequestedAt` | object
`status` | string
`lastLoginAt` | object
`createdAt` | Date
`updatedAt` | Date
`ordersCount` | number
`totalSpent` | number
`avgOrderValue` | number
`reviewsCount` | number
`avgRating` | object
`promosRedeemed` | number
`watchlistCount` | number
`sessionsCount` | number
`lastActiveAt` | object

## Example

```typescript
import type { AdminUserDetailDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "email": null,
  "role": null,
  "emailConfirmed": null,
  "pendingEmail": null,
  "isSuspended": null,
  "suspendedAt": null,
  "suspendedReason": null,
  "isDeleted": null,
  "deletedAt": null,
  "deletionRequestedAt": null,
  "status": null,
  "lastLoginAt": null,
  "createdAt": null,
  "updatedAt": null,
  "ordersCount": null,
  "totalSpent": null,
  "avgOrderValue": null,
  "reviewsCount": null,
  "avgRating": null,
  "promosRedeemed": null,
  "watchlistCount": null,
  "sessionsCount": null,
  "lastActiveAt": null,
} satisfies AdminUserDetailDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminUserDetailDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


