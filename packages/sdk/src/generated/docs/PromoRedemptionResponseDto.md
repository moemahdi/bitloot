
# PromoRedemptionResponseDto


## Properties

Name | Type
------------ | -------------
`id` | string
`promoCodeId` | string
`orderId` | string
`userId` | string
`email` | string
`discountApplied` | string
`originalTotal` | string
`finalTotal` | string
`createdAt` | string

## Example

```typescript
import type { PromoRedemptionResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "promoCodeId": null,
  "orderId": null,
  "userId": null,
  "email": null,
  "discountApplied": null,
  "originalTotal": null,
  "finalTotal": null,
  "createdAt": null,
} satisfies PromoRedemptionResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PromoRedemptionResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


