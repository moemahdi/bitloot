
# ProductResponseDto


## Properties

Name | Type
------------ | -------------
`id` | string
`slug` | string
`title` | string
`subtitle` | string
`description` | string
`platform` | string
`region` | string
`drm` | string
`ageRating` | string
`category` | string
`businessCategory` | string
`isFeatured` | boolean
`price` | string
`currency` | string
`isPublished` | boolean
`imageUrl` | string
`createdAt` | Date
`updatedAt` | Date
`developers` | Array&lt;string&gt;
`publishers` | Array&lt;string&gt;
`genres` | Array&lt;string&gt;
`releaseDate` | string
`metacriticScore` | number
`regionalLimitations` | string
`activationDetails` | string
`videos` | [Array&lt;VideoDto&gt;](VideoDto.md)
`languages` | Array&lt;string&gt;
`systemRequirements` | [Array&lt;SystemRequirementDto&gt;](SystemRequirementDto.md)
`tags` | Array&lt;string&gt;
`steam` | string
`screenshots` | [Array&lt;ScreenshotDto&gt;](ScreenshotDto.md)
`isPreorder` | boolean
`rating` | number

## Example

```typescript
import type { ProductResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": 123e4567-e89b-12d3-a456-426614174000,
  "slug": cyberpunk-2077-steam-us,
  "title": Cyberpunk 2077,
  "subtitle": Ultimate Edition,
  "description": An open-world, action-adventure RPG set in the dark future of Night City,
  "platform": Steam,
  "region": US,
  "drm": Steam,
  "ageRating": M - Mature 17+,
  "category": Games,
  "businessCategory": games,
  "isFeatured": false,
  "price": 59.99000000,
  "currency": EUR,
  "isPublished": true,
  "imageUrl": https://cdn.bitloot.io/products/cyberpunk-2077-cover.jpg,
  "createdAt": 2024-01-15T10:30Z,
  "updatedAt": 2024-01-20T15:45Z,
  "developers": ["CD Projekt Red"],
  "publishers": ["CD Projekt"],
  "genres": ["Action","RPG","Open World"],
  "releaseDate": 2020-12-10,
  "metacriticScore": 86,
  "regionalLimitations": Region free,
  "activationDetails": Download and install the game client, log in to your account, enter the key,
  "videos": null,
  "languages": ["English","German","French","Spanish"],
  "systemRequirements": null,
  "tags": ["base","action","open-world"],
  "steam": 1091500,
  "screenshots": null,
  "isPreorder": false,
  "rating": 4.5,
} satisfies ProductResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ProductResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


