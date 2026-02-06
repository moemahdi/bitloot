
# BulkImportInventoryDto


## Properties

Name | Type
------------ | -------------
`items` | [Array&lt;AddInventoryItemDto&gt;](AddInventoryItemDto.md)
`skipDuplicates` | boolean
`supplier` | string
`costPerItem` | number

## Example

```typescript
import type { BulkImportInventoryDto } from ''

// TODO: Update the object below with actual values
const example = {
  "items": null,
  "skipDuplicates": null,
  "supplier": Kinguin,
  "costPerItem": 4.99,
} satisfies BulkImportInventoryDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as BulkImportInventoryDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


