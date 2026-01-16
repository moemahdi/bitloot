
# FlashDealResponseDto


## Properties

Name | Type
------------ | -------------
`id` | string
`name` | string
`slug` | string
`headline` | string
`subHeadline` | string
`isActive` | boolean
`startsAt` | Date
`endsAt` | Date
`backgroundType` | string
`backgroundValue` | string
`accentColor` | string
`textColor` | string
`badgeText` | string
`badgeColor` | string
`ctaText` | string
`ctaLink` | string
`showCountdown` | boolean
`showProducts` | boolean
`productsCount` | number
`displayOrder` | number
`displayType` | string
`products` | Array&lt;string&gt;
`createdAt` | Date
`updatedAt` | Date

## Example

```typescript
import type { FlashDealResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "name": null,
  "slug": null,
  "headline": null,
  "subHeadline": null,
  "isActive": null,
  "startsAt": null,
  "endsAt": null,
  "backgroundType": null,
  "backgroundValue": null,
  "accentColor": null,
  "textColor": null,
  "badgeText": null,
  "badgeColor": null,
  "ctaText": null,
  "ctaLink": null,
  "showCountdown": null,
  "showProducts": null,
  "productsCount": null,
  "displayOrder": null,
  "displayType": null,
  "products": null,
  "createdAt": null,
  "updatedAt": null,
} satisfies FlashDealResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as FlashDealResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


