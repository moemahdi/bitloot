
# FulfillmentStatusDto


## Properties

Name | Type
------------ | -------------
`orderId` | string
`status` | string
`itemsFulfilled` | number
`itemsTotal` | number
`allFulfilled` | boolean
`updatedAt` | Date

## Example

```typescript
import type { FulfillmentStatusDto } from ''

// TODO: Update the object below with actual values
const example = {
  "orderId": 550e8400-e29b-41d4-a716-446655440000,
  "status": paid,
  "itemsFulfilled": 2,
  "itemsTotal": 3,
  "allFulfilled": true,
  "updatedAt": 2025-11-10T15:30Z,
} satisfies FulfillmentStatusDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as FulfillmentStatusDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


