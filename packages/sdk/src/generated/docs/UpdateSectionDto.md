
# UpdateSectionDto


## Properties

Name | Type
------------ | -------------
`isEnabled` | boolean
`displayOrder` | number
`config` | object
`scheduleStart` | string
`scheduleEnd` | string

## Example

```typescript
import type { UpdateSectionDto } from ''

// TODO: Update the object below with actual values
const example = {
  "isEnabled": null,
  "displayOrder": null,
  "config": null,
  "scheduleStart": null,
  "scheduleEnd": null,
} satisfies UpdateSectionDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UpdateSectionDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


