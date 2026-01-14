
# AdminReviewResponseDto


## Properties

Name | Type
------------ | -------------
`id` | string
`rating` | number
`title` | string
`content` | string
`authorName` | string
`isVerifiedPurchase` | boolean
`productName` | string
`productId` | string
`productSlug` | string
`orderItems` | [Array&lt;ReviewOrderItemDto&gt;](ReviewOrderItemDto.md)
`createdAt` | Date
`orderId` | string
`userId` | string
`userEmail` | string
`status` | string
`displayOnHomepage` | boolean
`adminNotes` | string
`approvedById` | string
`approvedByEmail` | string
`approvedAt` | Date
`updatedAt` | Date

## Example

```typescript
import type { AdminReviewResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": 550e8400-e29b-41d4-a716-446655440000,
  "rating": 5,
  "title": Great product!,
  "content": Fast delivery and works perfectly.,
  "authorName": John D.,
  "isVerifiedPurchase": true,
  "productName": Product Name,
  "productId": 550e8400-e29b-41d4-a716-446655440001,
  "productSlug": grand-theft-auto-v,
  "orderItems": null,
  "createdAt": 2025-01-15T10:30Z,
  "orderId": 550e8400-e29b-41d4-a716-446655440000,
  "userId": 550e8400-e29b-41d4-a716-446655440001,
  "userEmail": user@example.com,
  "status": pending,
  "displayOnHomepage": false,
  "adminNotes": Internal notes here,
  "approvedById": 550e8400-e29b-41d4-a716-446655440003,
  "approvedByEmail": admin@bitloot.io,
  "approvedAt": 2025-01-15T12:00Z,
  "updatedAt": 2025-01-15T10:30Z,
} satisfies AdminReviewResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminReviewResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


