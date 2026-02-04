
# AdminUserReviewDto


## Properties

Name | Type
------------ | -------------
`id` | string
`productId` | object
`productTitle` | object
`rating` | number
`title` | object
`content` | object
`status` | string
`createdAt` | Date

## Example

```typescript
import type { AdminUserReviewDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "productId": null,
  "productTitle": null,
  "rating": null,
  "title": null,
  "content": null,
  "status": null,
  "createdAt": null,
} satisfies AdminUserReviewDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminUserReviewDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


