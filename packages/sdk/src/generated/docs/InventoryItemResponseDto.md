
# InventoryItemResponseDto


## Properties

Name | Type
------------ | -------------
`id` | string
`productId` | string
`deliveryType` | string
`maskedPreview` | string
`status` | string
`expiresAt` | Date
`supplier` | string
`cost` | number
`notes` | string
`uploadedAt` | Date
`uploadedById` | string
`soldAt` | Date
`soldPrice` | number
`soldToOrderId` | string
`wasReported` | boolean

## Example

```typescript
import type { InventoryItemResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "productId": null,
  "deliveryType": null,
  "maskedPreview": XXXX-****-****-XXXX,
  "status": null,
  "expiresAt": null,
  "supplier": null,
  "cost": null,
  "notes": null,
  "uploadedAt": null,
  "uploadedById": null,
  "soldAt": null,
  "soldPrice": null,
  "soldToOrderId": null,
  "wasReported": null,
} satisfies InventoryItemResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as InventoryItemResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


