
# CreatePromoCodeDto


## Properties

Name | Type
------------ | -------------
`code` | string
`description` | string
`discountType` | string
`discountValue` | string
`minOrderValue` | string
`maxUsesTotal` | number
`maxUsesPerUser` | number
`scopeType` | string
`scopeValue` | string
`startsAt` | string
`expiresAt` | string
`stackable` | boolean
`isActive` | boolean

## Example

```typescript
import type { CreatePromoCodeDto } from ''

// TODO: Update the object below with actual values
const example = {
  "code": SUMMER2024,
  "description": Summer sale promotion,
  "discountType": null,
  "discountValue": 10,
  "minOrderValue": 25.00,
  "maxUsesTotal": 100,
  "maxUsesPerUser": 1,
  "scopeType": null,
  "scopeValue": null,
  "startsAt": null,
  "expiresAt": null,
  "stackable": null,
  "isActive": null,
} satisfies CreatePromoCodeDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreatePromoCodeDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


