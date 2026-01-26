
# ProviderConfigResponseDto


## Properties

Name | Type
------------ | -------------
`provider` | string
`displayName` | string
`description` | string
`activeEnvironment` | string
`sandbox` | [Array&lt;SystemConfigResponseDto&gt;](SystemConfigResponseDto.md)
`production` | [Array&lt;SystemConfigResponseDto&gt;](SystemConfigResponseDto.md)
`isComplete` | boolean
`missingKeys` | Array&lt;string&gt;

## Example

```typescript
import type { ProviderConfigResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "provider": null,
  "displayName": null,
  "description": null,
  "activeEnvironment": null,
  "sandbox": null,
  "production": null,
  "isComplete": null,
  "missingKeys": null,
} satisfies ProviderConfigResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ProviderConfigResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


