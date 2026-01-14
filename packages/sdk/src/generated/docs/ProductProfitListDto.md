
# ProductProfitListDto


## Properties

Name | Type
------------ | -------------
`products` | [Array&lt;ProductProfitDto&gt;](ProductProfitDto.md)
`total` | number
`period` | string

## Example

```typescript
import type { ProductProfitListDto } from ''

// TODO: Update the object below with actual values
const example = {
  "products": null,
  "total": null,
  "period": null,
} satisfies ProductProfitListDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ProductProfitListDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


