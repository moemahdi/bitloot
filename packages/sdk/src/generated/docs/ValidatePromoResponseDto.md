
# ValidatePromoResponseDto


## Properties

Name | Type
------------ | -------------
`valid` | boolean
`promoCodeId` | string
`discountAmount` | string
`discountType` | string
`discountValue` | string
`stackable` | boolean
`message` | string
`errorCode` | string

## Example

```typescript
import type { ValidatePromoResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "valid": null,
  "promoCodeId": null,
  "discountAmount": null,
  "discountType": null,
  "discountValue": null,
  "stackable": null,
  "message": null,
  "errorCode": null,
} satisfies ValidatePromoResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ValidatePromoResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


