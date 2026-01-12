
# OrderResponseDto


## Properties

Name | Type
------------ | -------------
`id` | string
`email` | string
`userId` | string
`status` | string
`sourceType` | string
`kinguinReservationId` | string
`total` | string
`orderSessionToken` | string
`payCurrency` | string
`items` | [Array&lt;OrderItemResponseDto&gt;](OrderItemResponseDto.md)
`createdAt` | string
`updatedAt` | string

## Example

```typescript
import type { OrderResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "email": null,
  "userId": null,
  "status": null,
  "sourceType": custom,
  "kinguinReservationId": null,
  "total": null,
  "orderSessionToken": null,
  "payCurrency": btc,
  "items": null,
  "createdAt": null,
  "updatedAt": null,
} satisfies OrderResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as OrderResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


