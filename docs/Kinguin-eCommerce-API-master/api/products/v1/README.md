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


 Here are **all the parameters/fields** you can grab from the Kinguin Products API:

---

## Complete Kinguin Product Object Fields

### Product Identification
| Field | Type | Description |
|-------|------|-------------|
| `kinguinId` | int | Kinguin's internal product ID |
| `productId` | string | MongoDB-style product ID |
| `name` | string | Full product name (includes platform) |
| `originalName` | string | Clean product name (without platform suffix) |

### Pricing & Stock
| Field | Type | Description |
|-------|------|-------------|
| `price` | float | Cheapest offer price (EUR) |
| `qty` | int | Total quantity from cheapest offers |
| `textQty` | int | Quantity of text-based keys (instant delivery) |
| `totalQty` | int | Total quantity across ALL offers |
| `offersCount` | int | Number of sellers/offers |
| `cheapestOfferId` | string[] | Array of cheapest offer IDs |

### Pre-order Status
| Field | Type | Description |
|-------|------|-------------|
| `isPreorder` | bool | Whether product is pre-order |
| `releaseDate` | string | Release date (YYYY-MM-DD) |

### Region & Restrictions
| Field | Type | Description |
|-------|------|-------------|
| `regionId` | int | Region ID (3 = Region Free) |
| `regionalLimitations` | string | Region name ("REGION FREE", "United States", etc.) |
| `countryLimitation` | string[] | Array of excluded country codes |

### Categorization
| Field | Type | Description |
|-------|------|-------------|
| `platform` | string | Platform (Steam, Xbox One, PS5, etc.) |
| `genres` | string[] | Array of genres (Action, Racing, etc.) |
| `tags` | string[] | Tags: `base`, `dlc`, `software`, `prepaid`, `indie valley` |
| `developers` | string[] | Array of developer names |
| `publishers` | string[] | Array of publisher names |

### Content & Details
| Field | Type | Description |
|-------|------|-------------|
| `description` | string | Full HTML product description |
| `activationDetails` | string | How to redeem/activate the key |
| `languages` | string[] | Supported languages |
| `ageRating` | string | Age rating (PEGI 3, ESRB M, etc.) |
| `metacriticScore` | float | Metacritic score (0-100) |
| `steam` | string | Steam App ID (if applicable) |

### Media
| Field | Type | Description |
|-------|------|-------------|
| `images.cover.url` | string | Full-size cover image URL |
| `images.cover.thumbnail` | string | Cover thumbnail URL |
| `images.screenshots[].url` | string | Screenshot full URL |
| `images.screenshots[].thumbnail` | string | Screenshot thumbnail URL |
| `videos[].video_id` | string | YouTube video ID |
| `videos[].video_url` | string | YouTube video URL |

### System Requirements (PC games)
| Field | Type | Description |
|-------|------|-------------|
| `systemRequirements[].system` | string | OS (Windows, Mac, Linux) |
| `systemRequirements[].requirement` | string[] | Array of requirement strings |

### Offers Array (Each Seller)
| Field | Type | Description |
|-------|------|-------------|
| `offers[].offerId` | string | Unique offer ID (use this to order) |
| `offers[].name` | string | Offer name |
| `offers[].price` | float | Price in EUR |
| `offers[].qty` | int | Total quantity |
| `offers[].availableQty` | int | Physical available quantity |
| `offers[].textQty` | int | Total text key quantity |
| `offers[].availableTextQty` | int | Available text keys |
| `offers[].merchantName` | string | Seller name |
| `offers[].isPreorder` | bool | Pre-order flag |
| `offers[].releaseDate` | string | Release date |
| `offers[].wholesale.enabled` | bool | Wholesale pricing available |
| `offers[].wholesale.tiers[].level` | int | Tier level (1=10+, 2=50+, 3=100+, 4=500+) |
| `offers[].wholesale.tiers[].price` | float | Tier price |

### Metadata
| Field | Type | Description |
|-------|------|-------------|
| `merchantName` | string[] | Array of cheapest offer seller names |
| `updatedAt` | string | Last update timestamp (ISO 8601) |

---

## Search Response Wrapper
When searching products, you get:
| Field | Type | Description |
|-------|------|-------------|
| `results` | object[] | Array of Product Objects |
| `item_count` | int | Total matching products |
