
# UpdateProductGroupDto


## Properties

Name | Type
------------ | -------------
`title` | string
`slug` | string
`description` | string
`coverImageUrl` | string
`tagline` | string
`isActive` | boolean
`displayOrder` | number
`isSpotlight` | boolean
`heroImageUrl` | string
`heroVideoUrl` | string
`releaseDate` | string
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
import type { UpdateProductGroupDto } from ''

// TODO: Update the object below with actual values
const example = {
  "title": null,
  "slug": null,
  "description": null,
  "coverImageUrl": null,
  "tagline": null,
  "isActive": null,
  "displayOrder": null,
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
} satisfies UpdateProductGroupDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UpdateProductGroupDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


