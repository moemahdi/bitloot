
# BalanceAlertDto


## Properties

Name | Type
------------ | -------------
`type` | string
`message` | string
`threshold` | number
`currentValue` | number

## Example

```typescript
import type { BalanceAlertDto } from ''

// TODO: Update the object below with actual values
const example = {
  "type": warning,
  "message": Low balance warning: Below €500,
  "threshold": 500,
  "currentValue": 234.56,
} satisfies BalanceAlertDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as BalanceAlertDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


