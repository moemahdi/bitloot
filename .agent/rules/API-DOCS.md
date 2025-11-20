---
trigger: model_decision
description: Read when working on the API integrations for the 3rd party services like Kinguin API , NOWPAYMENTS API, RESEND API , TAWK INTEGRATIONG 
---

When implementing or modifying any API logic of any of bitloot 3rd party API integrations, you **must read and strictly follow** the following documentation files:

* `docs/kinguin-API-documentation-summary.md`
* `docs/kinguin-API-documentation.md`
* `docs/kinguin-technical-documentation.md`
* `docs/resend-API-documentaion.md`
* `docs/nowpayments-API-documentaion.md`
* `docs/tawk-integration.md`

Use these documents to ensure:

1. Correct request/response formats
2. Accurate endpoint usage
3. Error-handling rules
4. Authentication / HMAC requirements
5. Rate limits and retry logic
6. Webhook behaviors
7. Idempotency and state transitions
8. Required headers, query params, and signing logic

Do **not** assume anything.
Always cross-check behavior with the above docs and ensure the implementation matches the provider’s specification exactly.