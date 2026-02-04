
# AdminUserListItemDto


## Properties

Name | Type
------------ | -------------
`id` | string
`email` | string
`role` | string
`emailConfirmed` | boolean
`isSuspended` | boolean
`isDeleted` | boolean
`status` | string
`ordersCount` | number
`totalSpent` | number
`reviewsCount` | number
`lastLoginAt` | object
`createdAt` | Date

## Example

```typescript
import type { AdminUserListItemDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "email": null,
  "role": null,
  "emailConfirmed": null,
  "isSuspended": null,
  "isDeleted": null,
  "status": null,
  "ordersCount": null,
  "totalSpent": null,
  "reviewsCount": null,
  "lastLoginAt": null,
  "createdAt": null,
} satisfies AdminUserListItemDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminUserListItemDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


