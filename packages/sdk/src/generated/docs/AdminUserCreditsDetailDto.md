
# AdminUserCreditsDetailDto


## Properties

Name | Type
------------ | -------------
`userId` | string
`balance` | [AdminUserCreditsBalanceDto](AdminUserCreditsBalanceDto.md)
`recentTransactions` | [Array&lt;AdminUserTransactionDto&gt;](AdminUserTransactionDto.md)

## Example

```typescript
import type { AdminUserCreditsDetailDto } from ''

// TODO: Update the object below with actual values
const example = {
  "userId": null,
  "balance": null,
  "recentTransactions": null,
} satisfies AdminUserCreditsDetailDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminUserCreditsDetailDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


