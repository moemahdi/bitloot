
# AdminProductResponseDto


## Properties

Name | Type
------------ | -------------
`id` | string
`externalId` | string
`kinguinId` | number
`kinguinProductId` | string
`sourceType` | string
`deliveryType` | string
`kinguinOfferId` | string
`slug` | string
`title` | string
`name` | string
`originalName` | string
`subtitle` | string
`description` | string
`platform` | string
`region` | string
`drm` | string
`ageRating` | string
`category` | string
`businessCategory` | string
`isFeatured` | boolean
`developers` | Array&lt;string&gt;
`publishers` | Array&lt;string&gt;
`genres` | Array&lt;string&gt;
`releaseDate` | string
`qty` | number
`textQty` | number
`offersCount` | number
`totalQty` | number
`isPreorder` | boolean
`metacriticScore` | number
`regionalLimitations` | string
`countryLimitation` | Array&lt;string&gt;
`regionId` | number
`activationDetails` | string
`videos` | [Array&lt;KinguinVideoDto&gt;](KinguinVideoDto.md)
`languages` | Array&lt;string&gt;
`systemRequirements` | [Array&lt;KinguinSystemRequirementDto&gt;](KinguinSystemRequirementDto.md)
`tags` | Array&lt;string&gt;
`merchantName` | Array&lt;string&gt;
`steam` | string
`screenshots` | [Array&lt;KinguinScreenshotDto&gt;](KinguinScreenshotDto.md)
`coverThumbnailUrl` | string
`cheapestOfferId` | Array&lt;string&gt;
`coverImageUrl` | string
`rating` | number
`cost` | string
`price` | string
`currency` | string
`isPublished` | boolean
`isCustom` | boolean
`featuredSections` | Array&lt;string&gt;
`featuredOrder` | number
`createdAt` | Date
`updatedAt` | Date
`deletedAt` | Date

## Example

```typescript
import type { AdminProductResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "externalId": null,
  "kinguinId": 20443,
  "kinguinProductId": 5c9b5e6b-89f6-4b3d-8f4e-abcdef123456,
  "sourceType": custom,
  "deliveryType": key,
  "kinguinOfferId": 5c9b5e6b-89f6-4b3d-8f4e-abcdef123456,
  "slug": null,
  "title": null,
  "name": null,
  "originalName": Counter-Strike: Source,
  "subtitle": null,
  "description": null,
  "platform": null,
  "region": null,
  "drm": null,
  "ageRating": null,
  "category": null,
  "businessCategory": games,
  "isFeatured": false,
  "developers": ["Valve"],
  "publishers": ["Valve"],
  "genres": ["Action","FPS"],
  "releaseDate": 2004-11-01,
  "qty": 100,
  "textQty": 50,
  "offersCount": 5,
  "totalQty": 200,
  "isPreorder": false,
  "metacriticScore": 88,
  "regionalLimitations": Region free,
  "countryLimitation": ["DE","AT"],
  "regionId": 1,
  "activationDetails": null,
  "videos": null,
  "languages": ["English","German","French"],
  "systemRequirements": null,
  "tags": ["base","dlc"],
  "merchantName": ["BestSeller","TopGames"],
  "steam": 730,
  "screenshots": null,
  "coverThumbnailUrl": null,
  "cheapestOfferId": null,
  "coverImageUrl": https://cdn.kinguin.net/media/images/products/cover.jpg,
  "rating": 4.5,
  "cost": null,
  "price": null,
  "currency": null,
  "isPublished": null,
  "isCustom": null,
  "featuredSections": ["trending","featured_games"],
  "featuredOrder": 0,
  "createdAt": null,
  "updatedAt": null,
  "deletedAt": null,
} satisfies AdminProductResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminProductResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


