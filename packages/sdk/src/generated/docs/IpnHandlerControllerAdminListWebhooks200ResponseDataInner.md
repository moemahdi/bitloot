
# IpnHandlerControllerAdminListWebhooks200ResponseDataInner


## Properties

Name | Type
------------ | -------------
`id` | string
`externalId` | string
`webhookType` | string
`processed` | boolean
`signatureValid` | boolean
`paymentStatus` | string
`orderId` | string
`paymentId` | string
`error` | string
`attemptCount` | number
`createdAt` | Date
`updatedAt` | Date

## Example

```typescript
import type { IpnHandlerControllerAdminListWebhooks200ResponseDataInner } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "externalId": null,
  "webhookType": nowpayments_ipn,
  "processed": null,
  "signatureValid": null,
  "paymentStatus": finished,
  "orderId": null,
  "paymentId": null,
  "error": null,
  "attemptCount": null,
  "createdAt": null,
  "updatedAt": null,
} satisfies IpnHandlerControllerAdminListWebhooks200ResponseDataInner

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as IpnHandlerControllerAdminListWebhooks200ResponseDataInner
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


