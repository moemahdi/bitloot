
# EffectivePriceResponseDto


## Properties

Name | Type
------------ | -------------
`productId` | string
`effectivePrice` | string
`originalPrice` | string
`discountPercent` | number
`currency` | string
`isDiscounted` | boolean
`flashDealId` | string

## Example

```typescript
import type { EffectivePriceResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "productId": null,
  "effectivePrice": null,
  "originalPrice": null,
  "discountPercent": null,
  "currency": null,
  "isDiscounted": null,
  "flashDealId": null,
} satisfies EffectivePriceResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EffectivePriceResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


