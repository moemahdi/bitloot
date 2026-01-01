
# FiltersResponseDto


## Properties

Name | Type
------------ | -------------
`platforms` | [Array&lt;PlatformFilterDto&gt;](PlatformFilterDto.md)
`regions` | [Array&lt;RegionFilterDto&gt;](RegionFilterDto.md)
`genres` | [Array&lt;GenreFilterDto&gt;](GenreFilterDto.md)
`priceRange` | [PriceRangeDto](PriceRangeDto.md)

## Example

```typescript
import type { FiltersResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "platforms": null,
  "regions": null,
  "genres": null,
  "priceRange": null,
} satisfies FiltersResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as FiltersResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


