
# AuditLogResponseDto


## Properties

Name | Type
------------ | -------------
`id` | string
`adminUserId` | string
`admin` | [AuditAdminDto](AuditAdminDto.md)
`action` | string
`target` | string
`payload` | object
`details` | string
`createdAt` | Date

## Example

```typescript
import type { AuditLogResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "adminUserId": null,
  "admin": null,
  "action": null,
  "target": null,
  "payload": null,
  "details": null,
  "createdAt": null,
} satisfies AuditLogResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AuditLogResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


