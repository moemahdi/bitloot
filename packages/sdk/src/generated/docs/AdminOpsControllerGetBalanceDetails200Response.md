
# AdminOpsControllerGetBalanceDetails200Response


## Properties

Name | Type
------------ | -------------
`accounts` | [Array&lt;AdminOpsControllerGetBalanceDetails200ResponseAccountsInner&gt;](AdminOpsControllerGetBalanceDetails200ResponseAccountsInner.md)
`totalEUR` | string
`lastSync` | string

## Example

```typescript
import type { AdminOpsControllerGetBalanceDetails200Response } from ''

// TODO: Update the object below with actual values
const example = {
  "accounts": null,
  "totalEUR": null,
  "lastSync": null,
} satisfies AdminOpsControllerGetBalanceDetails200Response

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminOpsControllerGetBalanceDetails200Response
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


