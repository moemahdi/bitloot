
# AdminControllerGetPayments200ResponseDataInner


## Properties

Name | Type
------------ | -------------
`id` | string
`orderId` | string
`externalId` | string
`status` | string
`provider` | string
`priceAmount` | string
`priceCurrency` | string
`payAmount` | string
`payCurrency` | string
`order` | [AdminControllerGetPayments200ResponseDataInnerOrder](AdminControllerGetPayments200ResponseDataInnerOrder.md)
`createdAt` | Date

## Example

```typescript
import type { AdminControllerGetPayments200ResponseDataInner } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "orderId": null,
  "externalId": null,
  "status": null,
  "provider": null,
  "priceAmount": null,
  "priceCurrency": null,
  "payAmount": null,
  "payCurrency": null,
  "order": null,
  "createdAt": null,
} satisfies AdminControllerGetPayments200ResponseDataInner

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminControllerGetPayments200ResponseDataInner
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


