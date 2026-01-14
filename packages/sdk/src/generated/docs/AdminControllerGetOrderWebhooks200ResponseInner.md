
# AdminControllerGetOrderWebhooks200ResponseInner


## Properties

Name | Type
------------ | -------------
`id` | string
`externalId` | string
`webhookType` | string
`paymentStatus` | string
`processed` | boolean
`signatureValid` | boolean
`error` | string
`createdAt` | Date

## Example

```typescript
import type { AdminControllerGetOrderWebhooks200ResponseInner } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "externalId": null,
  "webhookType": null,
  "paymentStatus": null,
  "processed": null,
  "signatureValid": null,
  "error": null,
  "createdAt": null,
} satisfies AdminControllerGetOrderWebhooks200ResponseInner

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminControllerGetOrderWebhooks200ResponseInner
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


