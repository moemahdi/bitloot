
# CreateAuditLogDto


## Properties

Name | Type
------------ | -------------
`adminUserId` | string
`action` | string
`target` | string
`payload` | object
`details` | string

## Example

```typescript
import type { CreateAuditLogDto } from ''

// TODO: Update the object below with actual values
const example = {
  "adminUserId": null,
  "action": null,
  "target": null,
  "payload": null,
  "details": null,
} satisfies CreateAuditLogDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreateAuditLogDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


