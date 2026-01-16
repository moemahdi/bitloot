
# PageConfigResponseDto


## Properties

Name | Type
------------ | -------------
`pageId` | string
`sections` | Array&lt;string&gt;
`activeFlashDeal` | [FlashDealResponseDto](FlashDealResponseDto.md)
`bundles` | Array&lt;string&gt;
`updatedAt` | Date
`cacheKey` | string

## Example

```typescript
import type { PageConfigResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "pageId": homepage,
  "sections": null,
  "activeFlashDeal": null,
  "bundles": null,
  "updatedAt": null,
  "cacheKey": null,
} satisfies PageConfigResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PageConfigResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


