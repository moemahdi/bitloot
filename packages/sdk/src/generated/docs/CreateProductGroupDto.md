
# CreateProductGroupDto


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
import type { CreateProductGroupDto } from ''

// TODO: Update the object below with actual values
const example = {
  "title": Battlefield 6,
  "slug": battlefield-6,
  "description": null,
  "coverImageUrl": null,
  "tagline": Available on 5 platforms,
  "isActive": null,
  "displayOrder": null,
  "isSpotlight": null,
  "heroImageUrl": null,
  "heroVideoUrl": https://www.youtube.com/embed/VIDEO_ID,
  "releaseDate": 2026-03-15T00:00:00Z,
  "longDescription": null,
  "accentColor": #FF6B00,
  "badgeText": NEW RELEASE,
  "metacriticScore": 85,
  "developerName": DICE,
  "publisherName": Electronic Arts,
  "genres": ["FPS","Action","Multiplayer"],
  "features": ["Next-gen graphics","128 player battles","Cross-platform play"],
  "faqItems": null,
  "spotlightOrder": null,
} satisfies CreateProductGroupDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreateProductGroupDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


