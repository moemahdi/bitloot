
# AdminControllerGetWebhookStats200Response


## Properties

Name | Type
------------ | -------------
`total` | number
`processed` | number
`pending` | number
`failed` | number
`invalidSignature` | number
`duplicates` | number
`successRate` | number
`byType` | [Array&lt;AdminControllerGetWebhookStats200ResponseByTypeInner&gt;](AdminControllerGetWebhookStats200ResponseByTypeInner.md)
`byStatus` | [Array&lt;AdminControllerGetWebhookStats200ResponseByStatusInner&gt;](AdminControllerGetWebhookStats200ResponseByStatusInner.md)
`periodStart` | Date
`periodEnd` | Date

## Example

```typescript
import type { AdminControllerGetWebhookStats200Response } from ''

// TODO: Update the object below with actual values
const example = {
  "total": null,
  "processed": null,
  "pending": null,
  "failed": null,
  "invalidSignature": null,
  "duplicates": null,
  "successRate": null,
  "byType": null,
  "byStatus": null,
  "periodStart": null,
  "periodEnd": null,
} satisfies AdminControllerGetWebhookStats200Response

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminControllerGetWebhookStats200Response
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


