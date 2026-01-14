
# ProfitAlertsDto


## Properties

Name | Type
------------ | -------------
`alerts` | [Array&lt;ProfitAlertDto&gt;](ProfitAlertDto.md)
`fetchedAt` | string
`overallStatus` | string

## Example

```typescript
import type { ProfitAlertsDto } from ''

// TODO: Update the object below with actual values
const example = {
  "alerts": null,
  "fetchedAt": null,
  "overallStatus": null,
} satisfies ProfitAlertsDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ProfitAlertsDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


