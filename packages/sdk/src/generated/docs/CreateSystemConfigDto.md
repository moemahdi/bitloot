
# CreateSystemConfigDto


## Properties

Name | Type
------------ | -------------
`provider` | string
`key` | string
`value` | string
`isSecret` | boolean
`environment` | string
`description` | string
`validationPattern` | string
`displayOrder` | number

## Example

```typescript
import type { CreateSystemConfigDto } from ''

// TODO: Update the object below with actual values
const example = {
  "provider": null,
  "key": api_key,
  "value": null,
  "isSecret": null,
  "environment": null,
  "description": null,
  "validationPattern": null,
  "displayOrder": null,
} satisfies CreateSystemConfigDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreateSystemConfigDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


