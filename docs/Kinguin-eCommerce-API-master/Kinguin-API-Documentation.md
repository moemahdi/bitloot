# Kinguin E-Commerce API developers documentation

Register on [Kinguin Integration](https://www.kinguin.net/integration)

- [Quick Start](quickstart/README.md)
- [API](api/README.md)
- [Webhooks](features/Webhooks.md)
- [Features](features/README.md)
- [CHANGELOG](CHANGELOG.md)

# Quick start

- [How to get API key](#how-to-get-api-key)
- [Search products](#search-products)
- [Place order](#place-an-order)
- [Download keys](#download-keys)


## How to get API key

1. Go to [Kinguin Integration](https://www.kinguin.net/integration) and click **APPLY FOR ACCESS** button.
2. If you don't have **Kinguin ID** account, please create it before.
3. Submit application request and wait for our approval. If you're an active Kinguin Seller your application will be automatically approved. You will be notified by e-mail when your application become approved.
4. Once your request has been approved you will be able to configure your first store [Dashboard](https://www.kinguin.net/integration/dashboard/stores).

> Keep your API key secret! Remember that credentials on SANDBOX environment are different.

> Your Kinguin ID account should have configured a default billing address - it is required to place order through our API.

## Search products

[Search products](../api/products/v1/README.md#search-products) you want to offer to your customers.

```bash
curl -X GET \
     -H 'X-Api-Key: [api-key]' \
     https://gateway.kinguin.net/esa/api/v1/products
```

Also read:

- [How to keep products up to date](../features/ProductUpdates.md)

## Register webhooks

[Register webhooks](../features/Webhooks.md) to be informed about order status changes.

## Place an order

[Place an order](../api/order/v2/README.md#place-an-order) with selected products.

```bash
curl -X POST \
     -H 'X-Api-Key: [api-key]' \
     -H 'Content-Type: application/json' \
     -d '{"products":[{"productId":"5c9b68662539a4e8f17ae2fe","qty":1,"price":5.79}]}' \
     https://gateway.kinguin.net/esa/api/v2/order
```

## Download keys

Download keys once they have been delivered [Download Keys](../api/order/v2/README.md#download-keys).

```bash
curl -X GET \
     -H 'X-Api-Key: [api-key]' \
     https://gateway.kinguin.net/esa/api/v2/order/PHS84FJAG5U/keys
```


# Buying pre-orders

### Requirements

1. The `keyType` field is not allowed with pre-order.
2. You can order only one pre-order per request.
3. Buying pre-order with regular products is not allowed.

### How to download the keys for pre-order

The keys will be delivered after their release date. 
If you have configured the `order.status` webhook, then you will receive the notification with the `completed` status, which means that keys have been delivered.


# How to keep products up to date

1. Register [webhooks](Webhooks.md)
2. Interval updates

```bash
    curl -H "X-Api-Key: [api-key]" -G --data-urlencode "updatedSince=[time-of-your-last-update]" https://gateway.kinguin.net/esa/api/v1/products
```

# Features

- [Buying pre-orders](./BuyingPreorders.md)
- [How to keep products up to date](ProductUpdates.md)
- [How to configure store ip whitelist](StoreIpWhitelist.md)


# Return keys

### Limitations

The return is not allowed, when:

1. The key has been claimed.
2. The order contains at least one wholesale item.
3. 24 hours have passed since the key was delivered.
4. Pre-order.

You can send only **one** request for return keys for given order.

### How to

Use this endpoint [Return Keys](../api/order/v2/README.md#return-keys) and send a request.
All keys meeting requirements will be returned and refunded during processing request.
In case of delay in delivering keys, the return will be executed separately once key will be delivered.

# Store ip whitelist

You can force additional authorization for your keys and orders by enabling whitelist of IP addresses from where requests will be sent to our API.

Addresses can be configured for each store separately.

### How to configure whitelist

Contact your business manager and pass them the list of your store ip addresses.

From now on, ordering, dispatching and key retrieval will be additionally protected.


# Webhooks

* [Product updated webhook](#product-updated-webhook)
* [Order status changed webhook](#order-status-changed-webhook)

# Headers

Each webhook contains a set of predefined headers:

| Header name      | Header value       |
|------------------|--------------------|
| `X-Event-Name`   | Webhook event name |
| `X-Event-Secret` | Your secret key    |

## Product updated webhook

The webhook is triggered when product was changed, became out of stock or when new offer became available.

### Example payload

Content-Type: `aplication/json`

`X-Event-Name` header: `product.update`

Request method: `POST`

```json
{
   "kinguinId": 1949,
   "productId": "5c9b5f6b2539a4e8f172916a",
   "qty": 845,
   "textQty": 845,
   "cheapestOfferId":["611222acff9ca40001f0b020"],
   "updatedAt": "2020-10-16T11:24:08.015+00:00"
}
```

| Field             |   Type   | Description                                |
|-------------------|:--------:|--------------------------------------------|
| `kinguinId`       |   int    | Product ID                                 |
| `productId`       |  string  | Another product ID                         |
| `qty`             |   int    | Total quantity from the cheapest offers    |
| `textQty`         |   int    | Quantity of `text` type serials            |
| `cheapestOfferId` | string[] | List of cheapest product ids               |
| `updatedAt`       |  string  | Date of change in format `Y-m-d\TH:i:s.vP` |


## Order status changed webhook

The webhook is triggered when an order status was changed.

### Example payload

Content-Type: `aplication/json`

`X-Event-Name` header: `order.status`

Request method: `POST`

```json
{
   "orderId": "PHS84FJAG5U",
   "orderExternalId": "AL2FEEHOO2OHF",
   "status": "canceled",
   "updatedAt": "2020-10-16T11:24:08.025+00:00"
}
```

| Field             |  Type  | Description                                              |
|-------------------|:------:|----------------------------------------------------------|
| `orderId`         | string | Order ID                                                 |
| `orderExternalId` | string | Order external ID                                        |
| `status`          | string | [Order Status](../api/order/v1/README.md#order-statuses) |
| `updatedAt`       | string | Date of change in format `Y-m-d\TH:i:s.vP`               |

### How to register webhooks

1. Login to your [Dashboard](https://www.kinguin.net/integration/dashboard/stores).
2. Go to **MY STORES** section and view store details.
3. Click on **WEBHOOKS** button.
4. Fill configuration form and click **SUBMIT** button.
5. Before saving, you can check if your endpoint responds correctly by clicking on **TEST URL** button.
6. Configure secret key to authorize incoming webhooks.


### Webhooks handling

Any webhook endpoint has to respond with any `2xx` status code and with empty body. If not, we will try to retry delivery several times.
After all failure retries the webhook will be rejected.

> We recommend to use **204 No Content** status.

> Keep in mind, that we are allowed to disable your endpoint when too many failed responses have been detected.

Webhooks are sent asynchronously, so the order in which they are sent may not be preserved.
To keep your data consistent store and validate the `updatedAt` property which is provided in each notification.


# Wholesale

### Guidelines

1. The `offerId` property is required when creating an order.
2. The maximum offer quantity is `1000`.
3. The maximum total order quantity is `1000`.
4. Wholesale is enabled only for offers with `wholesale.enabled` property equals to `true` and with ordered quantity greater than `9`.
5. Use pagination when downloading keys for wholesale when order total quantity is greater than `100`.

### How to buy wholesale

1. Get product details and find an offer with `wholesale.enabled` = true.
```json
{
  "offers": [
    {
      "name": "Counter-Strike: Source Steam CD Key",
      "offerId": "5f7efe3b369b4a0001c5b46f",
      "price": 5.79,
      "qty": 149,
      "textQty": 149,
      "merchantName": "KinguinHK",
      "releaseDate": "2004-11-01",
      "wholesale": {
        "enabled": true,
        "tiers": [
          {
            "level": 1,
            "price": 5.5
          },
          {
            "level": 2,
            "price": 5.4
          },
          {
            "level": 3,
            "price": 5.3
          },
          {
            "level": 4,
            "price": 5.2
          }
        ]
      }
    }
  ]
}

```
2. Pick the valid price according to the ordered quantity.

|  Level  | Qty  |
|:-------:|:-----|
|    1    | 10+  |  
|    2    | 50+  |  
|    3    | 100+ | 
|    4    | 500+ | 

3. Create an order.

```json
{
  "products": [
    {
      "kinguinId": 1949,
      "qty": 50,
      "price": 5.4,
      "offerId": "5f7efe3b369b4a0001c5b46f"
    }
  ]
}
```
# API documentation

Version: `v1`

## Table of Contents

- [Products `v1`](products/v1/README.md)
- [Products `v2`](products/v2/README.md)
- [Orders `v1`](order/v1/README.md)
- [Orders `v2`](order/v2/README.md)
- [Balance](balance/v1/README.md)
- [Errors Codes](ErrorsCodes.md)

## Environment

**PRODUCTION API**: https://gateway.kinguin.net/esa/api

**SANDBOX API**: https://gateway.sandbox.kinguin.net/esa/api

## How to create SANDBOX account

You can create SANDBOX account [here](https://sandbox.kinguin.net/integration) and get the API key analogical as on production. See [Quick start](../quickstart/README.md). 

After that, ask your business manager to fill your account with balance.

## Authorization

Authorization is based on HTTP header `X-Api-Key`. You can find your API key in a Dashboard in **MY STORES** section.

### Example

```bash
curl -X POST
     -H 'X-Api-Key: [api-key]' \
     https://gateway.kinguin.net/esa/api/v1/products
```

> Remember that credentials on SANDBOX environment are different.

If invalid API key is being provided you can expect response in below format:

```json
{
  "kind": "Authorization",
  "status": 401,
  "detail": "Invalid authentication data.",
  "type": "Unauthorized"
}
```


# Errors codes

In case of error API returns HTTP status code different from `2xx` and JSON object in below format:

```json
{
    "kind": "ConstraintViolation",
    "status": 400,
    "title": "Bad Request",
    "detail": "Invalid \"products\" property. Sum of total values of \"qty\" must be lower than or equal 90.",
    "path": "/api/v1/order",
    "method": "POST",
    "trace": "082a4cee9b",
    "timestamp": "2020-09-01T13:06:06+00:00",
    "propertyPath": "products",
    "invalidValue": 100
}
```

> Check `detail` property for more info about the reason.

### Table of error codes

| Kind                  | Description                                               |
|-----------------------|-----------------------------------------------------------|
| `ConstraintViolation` | The requested payload is invalid.                         |
| `Error`               | Unexpected error.                                         |
| `HttpClient`          | Internal request failed.                                  |
| `Http`                | Invalid http request.                                     |
| `Authorization`       | Bad authorization credentials.                            |
| `InsufficientBalance` | There are not enough funds to place an order.             |
| `OrderFailed`         | Unable to create an order.                                |
| `Preorder`            | Pre-orders validation error.                              |
| `ProductUnavailable`  | Unable to find any offer matching order request criteria. |
| `OrderNotFound`       | Order not found.                                          |
| `ResourceLock`        | Conflict with current resource version.                   |
| `OrderNotSupported`   | Order not supported due to platform legacy.               |
| `NoKeysToReturn`      | Return keys is not allowed for current resource version.  |

# Products API

Version: `v1`

## Table of Contents

- [Get product](#get-product)
- [Search products](#search-products)
- [Regions](#regions)
- [Platforms](#platforms)
- [Genres](#genres)


## Get product

`GET /v1/products/{kinguinId}`

### URL variables

| Field       | Type | Required | Description |
|-------------|:----:|:--------:|-------------|
| `kinguinId` | int  |   Yes    | Product ID  |

### Output

HTTP Status: `200`

Content-Type: `application/json`

Returns the [Product Object](#product-object)

#### Example request

```bash
curl -X GET \
     -H 'X-Api-Key: [api-key]' \
     https://gateway.kinguin.net/esa/api/v1/products/1949
```

#### Example response

```json
{
  "name":"Counter-Strike: Source Steam CD Key",
  "description":"Counter-Strike: Source blends Counter-Strike&#39;s award-winning teamplay action with the advanced technology of Source™ technology. Featuring state of the art graphics, all new sounds, and introducing physics, Counter-Strike: Source is a must-have for every action gamer.",
  "developers":[
    "Valve Corporation",
    "Hidden Path Entertainment"
  ],
  "publishers":[
    "Valve Corporation"
  ],
  "genres":[
    "Action"
  ],
  "platform":"Steam",
  "releaseDate":"2004-11-01",
  "qty":149,
  "textQty":149,
  "price":5.79,
  "cheapestOfferId":[
    "5f7efe3b369b4a0001c5b46f"
  ],
  "isPreorder":false,
  "metacriticScore":88,
  "regionalLimitations":"Region free",
  "countryLimitation":[
    "PR",
    "PS",
    "PT",
    "PW"
  ],
  "regionId":3,
  "activationDetails":"Go to:  http://store.steampowered.com/ and download STEAM client\r\n\r\n\r\nClick \"Install Steam\" (from the upper right corner)\r\n\r\n\r\nInstall and start application, login with your Account name and Password (create one if you don't have).\r\n\r\n\r\nPlease follow these instructions to activate a new retail purchase on Steam:\r\n\r\nLaunch Steam and log into your Steam account.\r\nClick the Games Menu.\r\nChoose Activate a Product on Steam...\r\nFollow the onscreen instructions to complete the process.\r\n\r\nAfter successful code verification go to the \"MY GAMES\" tab and start downloading.",
  "kinguinId":1949,
  "productId":"5c9b5f6b2539a4e8f172916a",
  "originalName":"Counter-Strike: Source",
  "videos":[
    {
      "video_id":"bvI62FUDpKA"
    }
  ],
  "languages":[
    "German",
    "English",
    "French",
    "Spanish",
    "Japanese",
    "Russian",
    "Chinese",
    "Korean",
    "Italian"
  ],
  "systemRequirements":[
    {
      "system":"Windows",
      "requirement":[
        "OS: Windows® 7 (32/64-bit)/Vista/XP",
        "Processor: 1.7 GHz ",
        "Memory: 512MB RAM",
        "Graphics: DirectX® 8.1 level Graphics Card (Requires support for SSE)",
        "Input: Mouse, Keyboard",
        "Additional note: Internet Connection"
      ]
    },
    {
      "system":"Mac",
      "requirement":[
        "OS: OS X version Leopard 10.5.8, Snow Leopard 10.6.3",
        "Memory: 1GB RAM",
        "Graphics: NVIDIA GeForce 8 or higher, ATI X1600 or higher, or Intel HD 3000 or higher ",
        "Input: Mouse, Keyboard",
        "Additional note: Internet Connection"
      ]
    },
    {
      "system":"Linux",
      "requirement":[
        "Processor: 1.7 GHz ",
        "Memory: 512MB RAM",
        "Input: Mouse, Keyboard",
        "Additional note: Internet Connection"
      ]
    }
  ],
  "tags":[
    "base"
  ],
  "offers":[
    {
      "name":"Counter-Strike: Source Steam CD Key",
      "offerId":"5f7efe3b369b4a0001c5b46f",
      "price":5.79,
      "qty":149,
      "textQty":149,
      "merchantName":"KinguinHK",
      "isPreorder":false,
      "releaseDate":"2004-11-01"
    }
  ],
  "offersCount":1,
  "totalQty":149,
  "merchantName":[
    "KinguinHK"
  ],
  "images":{
    "screenshots":[
      {
        "url":"https://cdns.kinguin.net/media/category//1/_/1_3418.jpg",
        "thumbnail":"https://cdns.kinguin.net/media/category/1/_/cache/200x120/1_3418.jpg"
      },
      {
        "url":"https://cdns.kinguin.net/media/category//4/_/4_3381.jpg",
        "thumbnail":"https://cdns.kinguin.net/media/category/4/_/cache/200x120/4_3381.jpg"
      },
      {
        "url":"https://cdns.kinguin.net/media/category//6/_/6_2882.jpg",
        "thumbnail":"https://cdns.kinguin.net/media/category/6/_/cache/200x120/6_2882.jpg"
      },
      {
        "url":"https://cdns.kinguin.net/media/category//7/_/7_101.jpg",
        "thumbnail":"https://cdns.kinguin.net/media/category/7/_/cache/200x120/7_101.jpg"
      },
      {
        "url":"https://cdns.kinguin.net/media/category//8/_/8_62.jpg",
        "thumbnail":"https://cdns.kinguin.net/media/category/8/_/cache/200x120/8_62.jpg"
      },
      {
        "url":"https://cdns.kinguin.net/media/category//9/_/9_37.jpg",
        "thumbnail":"https://cdns.kinguin.net/media/category/9/_/cache/200x120/9_37.jpg"
      }
    ],
    "cover":{
      "url":"https://cdns.kinguin.net/media/catalog/category/cache/1/hi_image/9df78eab33525d08d6e5fb8d27136e95/the-witcher-2-assassins-of-kings-enhanced-edition-cover.jpg",
      "thumbnail":"https://cdns.kinguin.net/media/catalog/category/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/Witcher-2-Extended_PC_US_ESRB.jpg"
    }
  },
  "updatedAt":"2020-10-24T09:34:13+00:00"
}
```

## Product Object

| Field                          |   Type   | Description                             |
|--------------------------------|:--------:|-----------------------------------------|
| `kinguinId`                    |   int    | Product ID                              |
| `productId`                    |  string  | Product ID                              |
| `cheapestOfferId`              | string[] | Array of cheapest offers id             |
| `name`                         |  string  | Product name                            |
| `originalName`                 |  string  | Product original name                   |
| `description`                  |  string  | Product description                     |
| `developers`                   | string[] | Array of developers list                |
| `publishers`                   | string[] | Array of publishers list                |
| `genres`                       | string[] | Array of [Genres](#genres)              |
| `platform`                     |  string  | [Platform](#platforms)                  |
| `releaseDate`                  |  string  | Release date                            |
| `qty`                          |   int    | Total cheapest offers quantity          |
| `price`                        |  float   | Cheapest offer price in EUR             |
| `textQty`                      |   int    | Quantity of `text` serials              |
| `offers`                       | object[] | Array of [Offer Object](/#offer-object) |
| `offersCount`                  |   int    | Total number of offers                  |
| `totalQty`                     |   int    | Total quantity from all offers          |
| `isPreorder`                   |   bool   | Pre-order                               |
| `metacriticScore`              |  float   | Metacritic score                        |
| `regionalLimitations`          |  string  | Region name                             |
| `countryLimitation`            | string[] | List of excluded country codes          |
| `regionId`                     |   int    | [Region](#regions)                      |
| `activationDetails`            |  string  | Activation details                      |
| `videos`                       | object[] | Array of videos                         |
| `languages`                    | string[] | Array of languages                      |
| `updatedAt`                    |  string  | Last update date                        |
| `systemRequirements`           | object[] | System requirements                     |
| `tags`                         | string[] | Array of [Tags](#tags)                  |
| `merchantName`                 | string[] | Array of cheapest offers seller names   |
| `ageRating`                    |  string  | Age rating (PEGI or ESRB)               |
| `steam`                        |  string  | Steam app id,                           |
| `images`                       | object[] | Holds product screenshots and covers    |
| `images.screenshots`           | object[] | Screenshots                             |
| `images.screenshots.url`       |  string  | URL to full width screenshot            |
| `images.screenshots.thumbnail` |  string  | URL to screenshot thumbnail             |
| `images.cover`                 | object[] | Cover                                   |
| `images.cover.url`             |  string  | URL to full width cover image           |
| `images.cover.thumbnail`       |  string  | URL to cover thumbnail                  |


## Offer Object

| Field                   |   Type    | Description                                                         |
|-------------------------|:---------:|---------------------------------------------------------------------|
| `name`                  |  string   | Offer name                                                          |
| `offerId`               |  string   | Offer ID                                                            |
| `price`                 |   float   | Offer price in EUR                                                  |
| `qty`                   |    int    | Total quantity                                                      |
| `availableQty`          |    int    | Physical available quantity                                         |
| `availableTextQty`      |    int    | Physical available quantity for text keys only                      |
| `textQty`               |    int    | Total available quantity for text keys only                         |
| `isPreorder`            |   bool    | Pre-order                                                           |
| `releaseDate`           |  string   | Release date                                                        |
| `wholesale.enabled`     |  boolean  | Determine whether offer can be purchased with wholesale tier prices |
| `wholesale.tiers.level` |    int    | Tier level                                                          |
| `wholesale.tiers.price` |   float   | Tier price                                                          |


## Tier levels

| Level | Quantity |
|:-----:|----------|
|   1   | 10+      |
|   2   | 50+      |
|   3   | 100+     |
|   4   | 500+     |



## Search products

`GET /v1/products`

### Query parameters

| Parameter        |  Type  | Description                                                                               |
|------------------|:------:|-------------------------------------------------------------------------------------------|
| `page`           |  int   | Page number (default: `1`)                                                                |
| `limit`          |  int   | Number products on page (default: `25`, maximum: `100`)                                   |
| `name`           | string | Product name (minimum: `3` characters)                                                    |
| `sortBy`         | string | Sort field name (values: `kingiunId`, `updatedAt`)                                        |
| `sortType`       | string | Sort type (values: `asc` or `desc`)                                                       |
| `priceFrom`      | float  | Price from **DEPRECATED**                                                                 |
| `priceTo`        | float  | Price to **DEPRECATED**                                                                   |
| `platform`       | string | Comma separated list of [Platform](#platforms)                                            |
| `genre`          | string | Comma separated list of [Genre](#genres)                                                  |
| `kinguinId`      | string | Comma separated list of product ID                                                        |
| `productId`      | string | Comma separated list of product ID                                                        |
| `languages`      | string | Language                                                                                  |
| `isPreorder`     | string | Pre-order (values: `yes` or `no`)                                                         |
| `activePreorder` | string | Only active pre-orders (values: `yes`)                                                    |
| `regionId`       |  int   | [Region](#regions)                                                                        |
| `tags`           | string | Comma separated list of [Tags](#tags)                                                     |
| `updatedSince`   | string | Date in formats `Y-m-d`, `Y-m-d H:i:s`, `Y-m-dTH:i:s`, `Y-m-dTH:i:s.uZ` or `Y-m-dTH:i:sP` |
| `updatedTo`      | string | Date in formats `Y-m-d`, `Y-m-d H:i:s`, `Y-m-dTH:i:s`, `Y-m-dTH:i:s.uZ` or `Y-m-dTH:i:sP` |
| `withText`       | string | Filter products only with text serials (values: `yes`)                                    |
| `merchantName`   | string | Seller name                                                                               |

### Output

HTTP Status: `200`

Content-Type: `application/json`

| Field        |   Type   | Description                                          |
|--------------|:--------:|------------------------------------------------------|
| `results`    | object[] | Array of [Product Object](#product-object)           |
| `item_count` |   int    | Total number of available products matching criteria |

#### Example request

```bash
curl -X GET \
     -H 'X-Api-Key: [api-key]' \
     https://gateway.kinguin.net/esa/api/v1/products?name=forza
```

#### Example response

```json
{
  "results":[
    {
      "name":"Counter-Strike: Source Steam CD Key",
      "description":"Counter-Strike: Source blends Counter-Strike&#39;s award-winning teamplay action with the advanced technology of Source™ technology. Featuring state of the art graphics, all new sounds, and introducing physics, Counter-Strike: Source is a must-have for every action gamer.",
      "developers":[
        "Valve Corporation",
        "Hidden Path Entertainment"
      ],
      "publishers":[
        "Valve Corporation"
      ],
      "genres":[
        "Action"
      ],
      "platform":"Steam",
      "releaseDate":"2004-11-01",
      "qty":149,
      "textQty":149,
      "price":5.79,
      "cheapestOfferId":[
        "5f7efe3b369b4a0001c5b46f"
      ],
      "isPreorder":false,
      "metacriticScore":88,
      "regionalLimitations":"Region free",
      "countryLimitation":[
        "PR",
        "PS",
        "PT",
        "PW"
      ],
      "regionId":3,
      "activationDetails":"Go to:  http://store.steampowered.com/ and download STEAM client\r\n\r\n\r\nClick \"Install Steam\" (from the upper right corner)\r\n\r\n\r\nInstall and start application, login with your Account name and Password (create one if you don't have).\r\n\r\n\r\nPlease follow these instructions to activate a new retail purchase on Steam:\r\n\r\nLaunch Steam and log into your Steam account.\r\nClick the Games Menu.\r\nChoose Activate a Product on Steam...\r\nFollow the onscreen instructions to complete the process.\r\n\r\nAfter successful code verification go to the \"MY GAMES\" tab and start downloading.",
      "kinguinId":1949,
      "productId":"5c9b5f6b2539a4e8f172916a",
      "originalName":"Counter-Strike: Source",
      "videos":[
        {
          "video_id":"bvI62FUDpKA"
        }
      ],
      "languages":[
        "German",
        "English",
        "French",
        "Spanish",
        "Japanese",
        "Russian",
        "Chinese",
        "Korean",
        "Italian"
      ],
      "systemRequirements":[
        {
          "system":"Windows",
          "requirement":[
            "OS: Windows® 7 (32/64-bit)/Vista/XP",
            "Processor: 1.7 GHz ",
            "Memory: 512MB RAM",
            "Graphics: DirectX® 8.1 level Graphics Card (Requires support for SSE)",
            "Input: Mouse, Keyboard",
            "Additional note: Internet Connection"
          ]
        },
        {
          "system":"Mac",
          "requirement":[
            "OS: OS X version Leopard 10.5.8, Snow Leopard 10.6.3",
            "Memory: 1GB RAM",
            "Graphics: NVIDIA GeForce 8 or higher, ATI X1600 or higher, or Intel HD 3000 or higher ",
            "Input: Mouse, Keyboard",
            "Additional note: Internet Connection"
          ]
        },
        {
          "system":"Linux",
          "requirement":[
            "Processor: 1.7 GHz ",
            "Memory: 512MB RAM",
            "Input: Mouse, Keyboard",
            "Additional note: Internet Connection"
          ]
        }
      ],
      "tags":[
        "base"
      ],
      "offers":[
        {
          "name":"Counter-Strike: Source Steam CD Key",
          "offerId":"5f7efe3b369b4a0001c5b46f",
          "price":5.79,
          "qty":149,
          "textQty":149,
          "merchantName":"KinguinHK",
          "isPreorder":false,
          "releaseDate":"2004-11-01"
        }
      ],
      "offersCount":1,
      "totalQty":149,
      "merchantName":[
        "KinguinHK"
      ],
      "images":{
        "screenshots":[
          {
            "url":"https://cdns.kinguin.net/media/category//1/_/1_3418.jpg",
            "thumbnail":"https://cdns.kinguin.net/media/category/1/_/cache/200x120/1_3418.jpg"
          },
          {
            "url":"https://cdns.kinguin.net/media/category//4/_/4_3381.jpg",
            "thumbnail":"https://cdns.kinguin.net/media/category/4/_/cache/200x120/4_3381.jpg"
          },
          {
            "url":"https://cdns.kinguin.net/media/category//6/_/6_2882.jpg",
            "thumbnail":"https://cdns.kinguin.net/media/category/6/_/cache/200x120/6_2882.jpg"
          },
          {
            "url":"https://cdns.kinguin.net/media/category//7/_/7_101.jpg",
            "thumbnail":"https://cdns.kinguin.net/media/category/7/_/cache/200x120/7_101.jpg"
          },
          {
            "url":"https://cdns.kinguin.net/media/category//8/_/8_62.jpg",
            "thumbnail":"https://cdns.kinguin.net/media/category/8/_/cache/200x120/8_62.jpg"
          },
          {
            "url":"https://cdns.kinguin.net/media/category//9/_/9_37.jpg",
            "thumbnail":"https://cdns.kinguin.net/media/category/9/_/cache/200x120/9_37.jpg"
          }
        ],
        "cover":{
          "url":"https://cdns.kinguin.net/media/catalog/category/cache/1/hi_image/9df78eab33525d08d6e5fb8d27136e95/the-witcher-2-assassins-of-kings-enhanced-edition-cover.jpg",
          "thumbnail":"https://cdns.kinguin.net/media/catalog/category/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/Witcher-2-Extended_PC_US_ESRB.jpg"
        }
      },
      "updatedAt":"2020-10-24T09:34:13+00:00"
    }
  ],
  "item_count":1
}
```

> API can return **404 Not Found** when product is not available or became out of stock.


### Tags

| Name           |
|----------------|
| `indie valley` |
| `dlc`          |
| `base`         |
| `software`     |
| `prepaid`      |

### Regions

`GET /v1/regions`

#### Example request

```bash
curl -X GET \
     -H 'X-Api-Key: [api-key]' \
     https://gateway.kinguin.net/esa/api/v1/regions
```

#### Example response

```json
[
  {
    "id":2,
    "name":"United States"
  },
  {
    "id":3,
    "name":"REGION FREE"
  },
  {
    "id":10,
    "name":" Rest of the world (RoW) - custom"
  }
]
```

### Platforms

`GET /v1/platforms`

#### Example request

```bash
curl -X GET \
     -H 'X-Api-Key: [api-key]' \
     https://gateway.kinguin.net/esa/api/v1/platforms
```

#### Example response

```json
[
  "PC Battle.net",
  "PC Epic Games",
  "PC GOG",
  "PC Mog Station",
  "PC Digital Download",
  "EA App",
  "PC Rockstar Games",
  "PC Steam",
  "PC Ubisoft Connect",
  "PC",
  "PC Digital Download",
  "2DS"
]
```

### Genres

`GET /v1/genres`

#### Example request

```bash
curl -X GET \
     -H 'X-Api-Key: [api-key]' \
     https://gateway.kinguin.net/esa/api/v1/genres
```

#### Example response

```json
[
  "Action",
  "Adult Games",
  "Adventure",
  "Anime",
  "Casual",
  "Co-op",
  "Dating Simulator",
  "FPS",
  "Fighting"
]
```
# Products API

Version: `v2`

## Table of Contents

- [Get product](#get-product)


## Get product

`GET /v2/products/{productId}`

### URL variables

| Field       |  Type  | Required | Description |
|-------------|:------:|:--------:|-------------|
| `productId` | string |   Yes    | Product ID  |

### Output

HTTP Status: `200`

Content-Type: `application/json`

Returns the [Product Object](../v1/README.md#product-object)

#### Example request

```bash
curl -X GET \
     -H 'X-Api-Key: [api-key]' \
     https://gateway.kinguin.net/esa/api/v2/products/5c9b5f6b2539a4e8f172916a
```
# Orders API

Version: `v1`

## Table of Contents

- [Place an order](#place-an-order)
- [Get order](#get-order)
- [Search orders](#search-orders)


## Place an order

`POST /v1/order`

### Input

Content-Type: `application/json`

```json
{
    "products": [
        {
            "kinguinId": [int],
            "qty": [int],
            "price": [float],
            "keyType": [string],
            "offerId": [string]
        },
        (...)
    ],
    "orderExternalId": [string]
}
```

| Field                |  Type  | Required | Description                                                                                                                               |
|----------------------|:------:|:--------:|-------------------------------------------------------------------------------------------------------------------------------------------|
| `products.kinguinId` |  int   |   Yes    | Product ID                                                                                                                                |
| `products.qty`*      |  int   |   Yes    | Quantity                                                                                                                                  |
| `products.price`     | float  |   Yes    | Price                                                                                                                                     |
| `products.keyType`   | string |    No    | Specify the type of key. The possible value is `text`. When the value is not provided, then the random type of the key will be delivered. |
| `products.offerId`** | string |    No    | Specify the exact offer you want to buy, otherwise the API will select offers according to the given price and available quantity.        |
| `orderExternalId`    | string |    No    | Custom reference to the order in external system. The value should be unique.                                                             |

> *The `qty` limit for one offer is `9`. The maximum number of items in `products` is `10`. For the wholesale purchases the limit is `1k`
> **This field is required only for wholesale purchases

### Output

HTTP Status: `201`

Content-Type: `application/json`

Returns the [Order Object](#order-object)

### Example request

```bash
curl -X POST \
     -H 'X-Api-Key: [api-key]' \
     -H 'Content-Type: application/json' \
     -d '{"products":[{"kinguinId":1949,"qty":1,"price":5.79}]}' \
     https://gateway.kinguin.net/esa/api/v1/order
```

### Example response

```json
{
    "totalPrice": 5.79,
    "requestTotalPrice": 5.79,
    "status": "processing",
    "userEmail": "...@kinguin.io",
    "storeId": 1,
    "createdAt": "2020-10-28T08:40:44+00:00",
    "orderId": "PHS84FJAG5U",
    "orderExternalId": "AL2FEEHOO2OHF",
    "paymentPrice": 5.29,
    "products": [
        {
            "kinguinId": 1949,
            "offerId": "5f7efd272f3a650001f42722",
            "productId": "5c9b68662539a4e8f17ae2fe",
            "qty": 1,
            "name": "Counter-Strike: Source Steam CD Key",
            "price": 5.79,
            "totalPrice": 5.79,
            "requestPrice": 5.79,
            "isPreorder": true,
            "releaseDate": "2020-10-07",
            "keyType": "text"
        }
    ],
    "totalQty": 1,
    "isPreorder": true,
    "preorderReleaseDate": "2020-10-07"
}
```

Also read:

- [Buying pre-orders](../../../features/BuyingPreorders.md)


## Get order

`GET /v1/order/{orderId}`

### URL variables

| Field     |  Type  | Required | Description |
|-----------|:------:|:--------:|-------------|
| `orderId` | string |   Yes    | Order ID    |

### Output

HTTP Status: `200`

Content-Type: `application/json`

Returns the [Order Object](#order-object)

### Example request

```bash
curl -X GET \
     -H 'X-Api-Key: [api-key]' \
     https://gateway.kinguin.net/esa/api/v1/order/PHS84FJAG5U
```

### Example response

```json
{
    "totalPrice": 5.79,
    "requestTotalPrice": 5.79,
    "status": "processing",
    "userEmail": "...@kinguin.io",
    "storeId": 1,
    "createdAt": "2020-10-28T08:40:44+00:00",
    "orderId": "PHS84FJAG5U",
    "orderExternalId": "AL2FEEHOO2OHF",
    "paymentPrice": 5.29,
    "products": [
        {
            "kinguinId": 1949,
            "offerId": "5f7efd272f3a650001f42722",
            "productId": "5c9b68662539a4e8f17ae2fe",
            "qty": 1,
            "name": "Counter-Strike: Source Steam CD Key",
            "price": 5.79,
            "totalPrice": 5.79,
            "requestPrice": 5.79,
            "isPreorder": true,
            "releaseDate": "2020-10-07",
            "keyType": "text",
            "keys": [
                {
                    "id": "67041c31e4d991383ee2a278",
                    "status": "DELIVERED"
                }
            ]
        }
    ],
    "totalQty": 1,
    "isPreorder": true,
    "preorderReleaseDate": "2020-10-07"
}
```

### Order Object

| Field                   |  Type  | Description                           |
|-------------------------|:------:|---------------------------------------|
| `totalPrice`            | float  | Order sell price                      |
| `requestTotalPrice`     | float  | Order requested price                 |
| `paymentPrice`          | string | Balance amount charged for this order |
| `status`                | string | [Order Status](#order-statuses)       |
| `userEmail`             | string | E-mail of the order owner             |
| `storeId`               |  int   | Store ID                              |
| `createdAt`             | string | Order creation date                   |
| `orderId`               | string | Order ID                              |
| `kinguinOrderId`        |  int   | Previous order ID                     |
| `orderExternalId`       | string | Order external ID                     |
| `isPreorder`            |  bool  | Pre-order                             |
| `totalQty`              |  int   | Total quantity from products          |
| `preorderReleaseDate`   | string | Release date                          |
| `products.kinguinId`    |  int   | Product ID                            |
| `products.offerId`      | string | Offer ID                              |
| `products.productId`    | string | Another product ID                    |
| `products.qty`          |  int   | Ordered quantity                      |
| `products.name`         | string | Product name                          |
| `products.price`        | float  | Product sell price                    |
| `products.totalPrice`   | float  | Total product sell price              |
| `products.requestPrice` | float  | Product request price                 |
| `products.isPreorder`   |  bool  | Pre-order                             |
| `products.releaseDate`  | string | Product release date                  |
| `products.keyType`      | string | Serial type for product               |
| `products.keys.id`      | string | Key id                                |
| `products.keys.status`  | string | [Key Status](#key-statuses)           |

## Search orders

`GET /v1/order`

### Query parameters

| Parameter         |  Type  | Description                                                                               |
|-------------------|:------:|-------------------------------------------------------------------------------------------|
| `page`            |  int   | Page number (default: `1`)                                                                |
| `limit`           |  int   | Limit results (default: `25`, maximum: `100`)                                             |
| `createdAtFrom`   | string | Date in formats `Y-m-d`, `Y-m-d H:i:s`, `Y-m-dTH:i:s`, `Y-m-dTH:i:s.uZ` or `Y-m-dTH:i:sP` |
| `createdAtTo`     | string | Date in formats `Y-m-d`, `Y-m-d H:i:s`, `Y-m-dTH:i:s`, `Y-m-dTH:i:s.uZ` or `Y-m-dTH:i:sP` |
| `kinguinId`       |  int   | Product ID                                                                                |
| `productId`       | string | Another product ID                                                                        |
| `orderId`         | string | Order ID                                                                                  |
| `orderExternalId` | string | Order external ID                                                                         |
| `status`          | string | [Order Status](#order-statuses)                                                           |
| `isPreorder`      | string | Pre-order (values: `yes` or `no`)                                                         |

### Output

HTTP Status: `200`

Content-Type: `application/json`

| Field        |   Type   | Description                                        |
|--------------|:--------:|----------------------------------------------------|
| `results`    | object[] | Array of [Order Object](#order-object)             |
| `item_count` |   int    | Total number of available orders matching criteria |

### Example request

```bash
curl -X GET \
     -H 'X-Api-Key: [api-key]' \
     https://gateway.kinguin.net/esa/api/v1/order?status=processing
```

### Example response

```json
{
    "results": [
        {
            "totalPrice": 5.79,
            "requestTotalPrice": 5.79,
            "status": "processing",
            "userEmail": "...@kinguin.io",
            "storeId": 1,
            "createdAt": "2020-10-28T08:40:44+00:00",
            "orderId": "PHS84FJAG5U",
            "orderExternalId": "AL2FEEHOO2OHF",
            "paymentPrice": 5.29,
            "products": [
                {
                    "kinguinId": 1949,
                    "offerId": "5f7efd272f3a650001f42722",
                    "productId": "5c9b68662539a4e8f17ae2fe",
                    "qty": 1,
                    "name": "Counter-Strike: Source Steam CD Key",
                    "price": 5.79,
                    "totalPrice": 5.79,
                    "requestPrice": 5.79,
                    "isPreorder": true,
                    "releaseDate": "2020-10-07",
                    "keyType": "text",
                    "keys": [
                        {
                            "id": "67041c31e4d991383ee2a278",
                            "status": "DELIVERED"
                        }
                    ]
                }
            ],
            "totalQty": 1,
            "isPreorder": true,
            "preorderReleaseDate": "2020-10-07"
        }
    ],
    "item_count": 1
}
```

### Order Statuses

|    Status    | Description                                       |
|:------------:|---------------------------------------------------|
| `processing` | Order is waiting for delivering the keys          |
| `completed`  | Order is completed (all keys have been delivered) |
|  `canceled`  | Order has been canceled                           |
|  `refunded`  | Order has been refunded                           |


### Key Statuses

|    Status    | Description            |
|:------------:|------------------------|
|  `PENDING`   | Waiting for processing |
| `PROCESSING` | Waiting for delivery   |
| `DELIVERED`  | Delivered              |
|  `RETURNED`  | Returned to stock      |
|  `REFUNDED`  | Balance refunded       |
|  `CANCELED`  | Canceled processing    |

# Orders API

Version: `v2`

## Table of Contents

- [Place an order](#place-an-order)
- [Download keys](#download-keys)
- [Return keys](#return-keys)


## Place an order

`POST /v2/order`

### Input

Content-Type: `application/json`

```json
{
    "products": [
        {
            "productId": [string],
            "qty": [int],
            "price": [float],
            "keyType": [string],
            "offerId": [string]
        },
        (...)
    ],
    "orderExternalId": [string]
}
```

| Field                |  Type  | Required | Description                                                                                                                               |
|----------------------|:------:|:--------:|-------------------------------------------------------------------------------------------------------------------------------------------|
| `products.productId` |  int   |   Yes    | Product ID                                                                                                                                |
| `products.qty`*      |  int   |   Yes    | Quantity                                                                                                                                  |
| `products.price`     | float  |   Yes    | Price                                                                                                                                     |
| `products.keyType`   | string |    No    | Specify the type of key. The possible value is `text`. When the value is not provided, then the random type of the key will be delivered. |
| `products.offerId`** | string |    No    | Specify the exact offer you want to buy, otherwise the API will select offers according to the given price and available quantity.        |
| `orderExternalId`    | string |    No    | Custom reference to the order in external system. The value should be unique.                                                             |

> *The `qty` limit for one offer is `9`. The maximum number of items in `products` is `10`. For the wholesale purchases the limit is `1k`
> **This field is required only for wholesale purchases

### Output

HTTP Status: `201`

Content-Type: `application/json`

Returns the [Order Object](../v1/README.md#order-object)

### Example request

```bash
curl -X POST \
     -H 'X-Api-Key: [api-key]' \
     -H 'Content-Type: application/json' \
     -d '{"products":[{"productId":"5c9b68662539a4e8f17ae2fe","qty":1,"price":5.79}]}' \
     https://gateway.kinguin.net/esa/api/v2/order
```
Also read:

- [Buying pre-orders](../../../features/BuyingPreorders.md)



## Download keys

`GET /v2/order/{orderId}/keys`

### URL variables

| Field     |  Type  | Required | Description |
|-----------|:------:|:--------:|-------------|
| `orderId` | string |   Yes    | Order ID    |

### Query parameters

| Parameter | Type | Required | Description                                             |
|-----------|:----:|:--------:|---------------------------------------------------------|
| `page`    | int  |    No    | Page number (default: `1`)                              |
| `limit`   | int  |    No    | Number products on page (default: `25`, maximum: `100`) |

### Output

HTTP Status: `200`

Content-Type: `application/json`

Returns the array of [Key Object](../v2/README.md#key-object)

### Example request

```bash
curl -X GET \
     -H 'X-Api-Key: [api-key]' \
     https://gateway.kinguin.net/esa/api/v2/order/PHS84FJAG5U/keys?page=1
```

### Example response

```json
[
    {
        "id": "67041c31e4d991383ee2a278",
        "serial": "0ddbebb2-559d-42e9-a8e1-fd4b2bdea858",
        "type": "text/plain",
        "name": "Counter-Strike: Source Steam CD Key",
        "kinguinId": 1949,
        "offerId": "5f7efd272f3a650001f42722",
        "productId": "5c9b68662539a4e8f17ae2fe"
    }
]
```

### Key Object

| Field       |  Type  | Description                                                                          |
|-------------|:------:|--------------------------------------------------------------------------------------|
| `id`        | string | Key id                                                                               |
| `name`      | string | Product name                                                                         |
| `type`      | string | Serial content type. Can be `text/plain` or `image/jpeg`, `image/png` or `image/gif` |
| `serial`    | string | Plain text serial key or in case of `image/*` base64 encoded content of the image    |
| `kinguinId` |  int   | Product ID                                                                           |
| `offerId`   | string | Offer ID                                                                             |
| `productId` | string | Product ID                                                                           |

The key is available once it has been delivered to the order. There are few strategies how to download all keys:
1. Call the [Download keys](#download-keys) endpoint periodically using pagination.
2. Register the [order.status](../../../features/Webhooks.md) webhook and download all keys when order status will be `completed`.
3. Load order details [Get Order](../v1/README.md#get-order) periodically and check whether given keys has been delivered.


## Return keys

`POST /v2/order/{orderId}/keys/return`

### URL variables

| Field     |  Type  | Required | Description |
|-----------|:------:|:--------:|-------------|
| `orderId` | string |   Yes    | Order ID    |

### Output

HTTP Status: `200`

Content-Type: `application/json`

| Field    |  Type  | Description                                |
|----------|:------:|--------------------------------------------|
| `id`     | string | Key id                                     |
| `status` | string | [Key Status](../v1/README.md#key-statuses) |


### Example request

```bash
curl -X POST \
     -H 'X-Api-Key: [api-key]' \
     https://gateway.kinguin.net/esa/api/v2/order/PHS84FJAG5U/keys/return
```

### Example response

```json
[
    {
        "id": "67041c31e4d991383ee2a278",
        "status": "DELIVERED"
    },
    {
        "id": "67041c31e4d991383ee2a279",
        "status": "DELIVERED"
    }
]
```

Also read:

- [Return Keys](../../../features/ReturnKeys.md)


# Balance API

Version: `v1`

## Table of Contents

- [Get balance](#get-balance)

## Get balance

`GET /v1/balance`

### Output

HTTP Status: `200`

Content-Type: `application/json`

```json
{
    "balance": [float]
}
```

| Field     | Type  | Description   |
|-----------|:-----:|---------------|
| `balance` | float | Balance value |

### Example request

```bash
curl -X GET \
     -H 'X-Api-Key: [api-key]' \
     https://gateway.kinguin.net/esa/api/v1/balance
```

### Example response

```json
{
    "balance": 12.45
}
```
