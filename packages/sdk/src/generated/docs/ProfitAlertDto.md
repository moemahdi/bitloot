
# ProfitAlertDto


## Properties

Name | Type
------------ | -------------
`type` | string
`metric` | string
`message` | string
`currentValue` | number
`threshold` | number
`recommendation` | string

## Example

```typescript
import type { ProfitAlertDto } from ''

// TODO: Update the object below with actual values
const example = {
  "type": null,
  "metric": null,
  "message": null,
  "currentValue": null,
  "threshold": null,
  "recommendation": null,
} satisfies ProfitAlertDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ProfitAlertDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


