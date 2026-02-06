
# DeliveryContentDto


## Properties

Name | Type
------------ | -------------
`productTitle` | string
`deliveryType` | string
`deliveryInstructions` | string
`deliveredAt` | string
`items` | [Array&lt;DeliveryContentItemDto&gt;](DeliveryContentItemDto.md)
`notes` | string
`faceValue` | number
`currency` | string
`activationUrl` | string

## Example

```typescript
import type { DeliveryContentDto } from ''

// TODO: Update the object below with actual values
const example = {
  "productTitle": Game Title - Steam Key,
  "deliveryType": key,
  "deliveryInstructions": Redeem on Steam client > Games > Activate a Product,
  "deliveredAt": 2026-02-04T12:00:00Z,
  "items": null,
  "notes": null,
  "faceValue": 50,
  "currency": USD,
  "activationUrl": https://store.steampowered.com/account/registerkey,
} satisfies DeliveryContentDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as DeliveryContentDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


