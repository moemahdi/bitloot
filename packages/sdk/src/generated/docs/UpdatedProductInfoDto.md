
# UpdatedProductInfoDto


## Properties

Name | Type
------------ | -------------
`id` | string
`title` | string
`externalId` | string
`priceChange` | [UpdatedProductInfoDtoPriceChange](UpdatedProductInfoDtoPriceChange.md)

## Example

```typescript
import type { UpdatedProductInfoDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "title": null,
  "externalId": null,
  "priceChange": null,
} satisfies UpdatedProductInfoDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UpdatedProductInfoDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


