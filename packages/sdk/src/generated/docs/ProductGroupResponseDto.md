
# ProductGroupResponseDto


## Properties

Name | Type
------------ | -------------
`id` | string
`title` | string
`slug` | string
`description` | string
`coverImageUrl` | string
`tagline` | string
`isActive` | boolean
`displayOrder` | number
`minPrice` | string
`maxPrice` | string
`productCount` | number
`createdAt` | Date
`updatedAt` | Date
`isSpotlight` | boolean
`heroImageUrl` | string
`heroVideoUrl` | string
`releaseDate` | Date
`longDescription` | string
`accentColor` | string
`badgeText` | string
`metacriticScore` | number
`developerName` | string
`publisherName` | string
`genres` | Array&lt;string&gt;
`features` | Array&lt;string&gt;
`faqItems` | [Array&lt;FaqItemDto&gt;](FaqItemDto.md)
`spotlightOrder` | number

## Example

```typescript
import type { ProductGroupResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "title": null,
  "slug": null,
  "description": null,
  "coverImageUrl": null,
  "tagline": null,
  "isActive": null,
  "displayOrder": null,
  "minPrice": null,
  "maxPrice": null,
  "productCount": null,
  "createdAt": null,
  "updatedAt": null,
  "isSpotlight": null,
  "heroImageUrl": null,
  "heroVideoUrl": null,
  "releaseDate": null,
  "longDescription": null,
  "accentColor": null,
  "badgeText": null,
  "metacriticScore": null,
  "developerName": null,
  "publisherName": null,
  "genres": null,
  "features": null,
  "faqItems": null,
  "spotlightOrder": null,
} satisfies ProductGroupResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ProductGroupResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


