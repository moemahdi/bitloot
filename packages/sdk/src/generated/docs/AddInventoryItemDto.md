
# AddInventoryItemDto


## Properties

Name | Type
------------ | -------------
`itemData` | object
`expiresAt` | string
`supplier` | string
`cost` | number
`notes` | string

## Example

```typescript
import type { AddInventoryItemDto } from ''

// TODO: Update the object below with actual values
const example = {
  "itemData": {"type":"key","key":"XXXXX-XXXXX-XXXXX-XXXXX"},
  "expiresAt": 2025-12-31T23:59:59Z,
  "supplier": G2A,
  "cost": 5.99,
  "notes": Bought on sale,
} satisfies AddInventoryItemDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AddInventoryItemDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


