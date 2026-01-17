
# PromoCodeResponseDto


## Properties

Name | Type
------------ | -------------
`id` | string
`code` | string
`description` | string
`discountType` | string
`discountValue` | string
`minOrderValue` | string
`maxUsesTotal` | number
`maxUsesPerUser` | number
`usageCount` | number
`scopeType` | string
`scopeValue` | string
`startsAt` | string
`expiresAt` | string
`stackable` | boolean
`isActive` | boolean
`createdAt` | string
`updatedAt` | string

## Example

```typescript
import type { PromoCodeResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "code": null,
  "description": null,
  "discountType": null,
  "discountValue": null,
  "minOrderValue": null,
  "maxUsesTotal": null,
  "maxUsesPerUser": null,
  "usageCount": null,
  "scopeType": null,
  "scopeValue": null,
  "startsAt": null,
  "expiresAt": null,
  "stackable": null,
  "isActive": null,
  "createdAt": null,
  "updatedAt": null,
} satisfies PromoCodeResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PromoCodeResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


