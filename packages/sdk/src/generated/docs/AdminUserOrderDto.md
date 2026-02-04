
# AdminUserOrderDto


## Properties

Name | Type
------------ | -------------
`id` | string
`status` | string
`total` | string
`currency` | string
`itemsCount` | number
`createdAt` | Date
`paidAt` | object
`fulfilledAt` | object

## Example

```typescript
import type { AdminUserOrderDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "status": null,
  "total": null,
  "currency": null,
  "itemsCount": null,
  "createdAt": null,
  "paidAt": null,
  "fulfilledAt": null,
} satisfies AdminUserOrderDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminUserOrderDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


