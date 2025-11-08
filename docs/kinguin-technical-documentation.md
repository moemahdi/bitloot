openapi: 3.0.0
info:
title: Sales Manager API V1
version: v1
description: API endpoints for managing merchants, stock, offers, wholesale, reservations and alerts.
servers:

- url: https://gateway.sandbox.kinguin.net/sales-manager-api
  description: Sandbox URL
- url: https://gateway.kinguin.net/sales-manager-api
  description: Production URL
  tags:
- name: Alerts
- name: Reservations
- name: Wholesale
- name: Cards
- name: Merchants
- name: Products
- name: Offers
- name: Stock
- name: Sales Booster
  paths:

# ALERTS

/api/v1/alerts:
get:
summary: Get Alerts
tags: - Alerts
security: - BearerAuth: [ ]
parameters: - name: filter
in: query
description: Filter parameters for alerts
schema:
$ref: '#/components/schemas/AlertsFilter' - name: page
in: query
description: Page parameters
schema:
$ref: '#/components/schemas/Pageable'
responses:
'200':
description: Successful
content:
application/json:
schema:
$ref: '#/components/schemas/AlertDocumentPage'
'401':
description: Unauthorized
/api/v1/alerts/{alertId}:
get:
summary: Get Alert by ID
tags: - Alerts
security: - BearerAuth: [ ]
parameters: - name: alertId
in: path
description: ID of the alert to retrieve
required: true
schema:
type: string
responses:
'200':
description: Successful
content:
application/json:
schema:
$ref: '#/components/schemas/AlertDocument'
'401':
description: Unauthorized
'404':
description: Alert not found

# RESERVATIONS

/api/v1/reservations:
get:
summary: Get Reservations
tags: - Reservations
security: - BearerAuth: [ ]
parameters: - name: filters
in: query
description: Filter parameters for reservations
schema:
$ref: '#/components/schemas/ReservationsFilter' - name: page
in: query
description: Page parameters
schema:
$ref: '#/components/schemas/Pageable'
responses:
'200':
description: Successful
content:
application/json:
schema:
$ref: '#/components/schemas/PagedReservationRepresentationModel'
'401':
description: Unauthorized
/api/v1/reservations/archive:
get:
summary: Get Archived Reservations
tags: - Reservations
security: - BearerAuth: [ ]
parameters: - name: filters
in: query
description: Filter parameters for archived reservations
schema:
$ref: '#/components/schemas/ReservationsFilter' - name: page
in: query
description: Page parameters
schema:
$ref: '#/components/schemas/Pageable'
responses:
'200':
description: Successful
content:
application/json:
schema:
$ref: '#/components/schemas/PagedReservationRepresentationModel'
'401':
description: Unauthorized
/api/v1/reservations/stats:
get:
summary: Get Reservations Stats
tags: - Reservations
security: - BearerAuth: [ ]
parameters: - name: filters
in: query
description: Filter parameters for reservations statistics
schema:
$ref: '#/components/schemas/ReservationsStatsFilter'
responses:
'200':
description: Successful, returns Map<String, Stats>
content:
application/json:
schema:
type: object
additionalProperties:
$ref: '#/components/schemas/Stats'
'401':
description: Unauthorized
/api/v1/reservations/csv:
get:
summary: Export Reservations to CSV
tags: - Reservations
security: - BearerAuth: [ ]
parameters: - name: filters
in: query
description: Filter parameters for reservations to export
schema:
$ref: '#/components/schemas/ReservationsFilter'
responses:
'200':
description: Successful
content:
text/csv:
schema:
type: string
format: binary
'401':
description: Unauthorized

# /api/v1/reservations/delivery:

# patch:

# summary: Change Reservation Delivery Status (only for ingame product type)

# tags:

# - Reservations

# security:

# - BearerAuth: [ ]

# requestBody:

# content:

# application/json:

# schema:

# $ref: '#/components/schemas/DeliveryStatusRequest'

# responses:

# '204':

# description: Delivery status updated successfully.

# '400':

# description: Invalid request.

# '401':

# description: Unauthorized

# WHOLESALE

/api/v1/wholesale/product/{productId}/offers:
get:
summary: Get Wholesale Offers for Product
tags: - Wholesale
parameters: - name: productId
in: path
description: ID of the product to retrieve wholesale offers for
required: true
schema:
type: string - name: outOfStock
in: query
description: Flag to include out of stock offers
schema:
type: boolean
responses:
'200':
description: Successful
content:
application/json:
schema:
type: array
items:
$ref: '#/components/schemas/WholesaleOfferRepresentationModel'
/api/v1/wholesale/product/{productId}/best:
get:
summary: Get Best Wholesale Offer for Product
tags: - Wholesale
security: - BearerAuth: [ ]
parameters: - name: productId
in: path
description: ID of the product to retrieve the best wholesale offer for
required: true
schema:
type: string
responses:
'200':
description: Successful
content:
application/json:
schema:
$ref: '#/components/schemas/WholesaleOfferRepresentationModel'
'401':
description: Unauthorized
'404':
description: Not found
/api/v1/wholesale/offers:
get:
summary: Get Wholesale Offers
tags: - Wholesale
parameters: - name: filter
in: query
description: Filter parameters for wholesale offers
schema:
$ref: '#/components/schemas/OffersFilter' - name: page
in: query
description: Page parameters
schema:
$ref: '#/components/schemas/Pageable'
responses:
'200':
description: Successful
content:
application/json:
schema:
$ref: '#/components/schemas/PageImplWholesaleOfferRepresentationModel'
/api/v1/wholesale/configuration:
get:
summary: Get Wholesale Configuration
tags: - Wholesale
security: - BearerAuth: [ ]
responses:
'200':
description: Successful
content:
application/json:
schema:
$ref: '#/components/schemas/WholesaleConfigurationRepresentationModel'
'401':
description: Unauthorized
'404':
description: Not found
post:
summary: Edit Wholesale Configuration
tags: - Wholesale
security: - BearerAuth: [ ]
parameters: - name: wholesaleConfigurationRequest
in: body
description: Wholesale Configuration Request
required: true
content:
application/json:
schema:
$ref: '#/components/schemas/WholesaleConfigurationRequest'
responses:
'200':
description: Successful
content:
application/json:
schema:
$ref: '#/components/schemas/WholesaleConfigurationRepresentationModel'
'404':
description: Not found
/api/v1/products/{productId}/defaultWholesaleTier:
get:
summary: Get default Wholesale Tier for Product
tags: - Wholesale
parameters: - name: productId
in: path
description: ID of the product to retrieve the default wholesale tier for
required: true
schema:
type: string
responses:
'200':
description: Successful
content:
application/json:
schema:
$ref: '#/components/schemas/WholesaleRequest'
'400':
description: Unable to create offer. Product does not exist.

# CARDS

/api/v1/returns/ktc/{cardId}:
post:
summary: Return item to stock by cardId
security: - BearerAuth: [ ]
tags: - Cards
parameters: - name: cardId
in: path
description: ID of the card (ktcId)
required: true
schema:
type: string
responses:
'200':
description: Successful
'401':
description: Unauthorized
'403':
description: Forbidden
'404':
description: Not found
'405':
description: Invalid cardId

# MERCHANTS

/api/v1/merchants:
get:
summary: Get Seller
tags: - Merchants
security: - BearerAuth: [ ]
responses:
'200':
description: Successful
content:
application/json:
schema:
$ref: '#/components/schemas/SellerRepresentationModel'
'401':
description: Unauthorized
post:
summary: Create Merchant
tags: - Merchants
security: - BearerAuth: [ ]
requestBody:
required: true
content:
application/json:
schema:
$ref: '#/components/schemas/MerchantRequest'
responses:
'200':
description: Successful
content:
application/json:
schema:
$ref: '#/components/schemas/MerchantDocument'
'400':
description: Email invalid
'401':
description: Unauthorized
'409':
description: Merchant already created
/api/v1/merchants/status:
get:
summary: Get Merchant Status
tags: - Merchants
security: - BearerAuth: [ ]
responses:
'200':
description: Successful
content:
application/json:
schema:
$ref: '#/components/schemas/MerchantDocument'
'401':
description: Unauthorized
/api/v1/merchants/findByName:
get:
summary: Find Merchant by Name
tags: - Merchants
security: - BearerAuth: [ ]
parameters: - name: name
in: query
description: Name of the merchant to find
required: true
schema:
type: string
responses:
'200':
description: Successful
content:
application/json:
schema:
type: integer
'401':
description: Unauthorized
'404':
description: Merchant not found
/api/v1/merchants/findByNameLike:
get:
summary: Find Merchants by Name (Like)
tags: - Merchants
parameters: - name: name
in: query
description: Name of the merchant to find (partial match)
required: true
schema:
type: string
responses:
'200':
description: Successful
content:
application/json:
schema:
type: array
items:
$ref: '#/components/schemas/MerchantPublicResponse'

# PRODUCTS

/api/v1/product/minimalPrice/{productId}:
get:
summary: Get Microsoft product minimal price by product ID
tags: - Products
parameters: - in: path
name: productId
required: true
schema:
type: string
responses:
'200':
description: OK
content:
application/json:
schema:
$ref: '#/components/schemas/ProductMinimalPriceDocument'

# OFFERS

/api/v1/offers/{offerId}/popularity:
post:
summary: Set bid value for offer
tags: - Sales Booster
security: - BearerAuth: [ ]
parameters: - in: path
name: offerId
required: true
schema:
type: string
requestBody:
required: true
content:
application/json:
schema:
$ref: '#/components/schemas/PopularityRequest'
responses:
'200':
description: Successful
content:
application/json:
schema:
$ref: '#/components/schemas/OfferRepresentationModel'
'400':
description: Invalid bid
'401':
description: Unauthorized
'403':
description: Forbidden
'404':
description: Not Found
/api/v1/offers/{offerId}/position:
get:
summary: Get position for offer
tags: - Offers
security: - BearerAuth: [ ]
parameters: - in: path
name: offerId
required: true
schema:
type: string - in: query
name: bid
schema:
type: integer - in: query
name: price
schema:
type: integer
responses:
'200':
description: Successful
content:
application/json:
schema:
$ref: '#/components/schemas/OfferPromotion'
'401':
description: Unauthorized
'404':
description: Not Found
/api/v1/offers:
post:
tags: - Offers
summary: Create Offer
operationId: createOffer
security: - BearerAuth: [ ]
requestBody:
required: true
content:
application/json:
schema:
$ref: '#/components/schemas/OfferRequest'
responses:
'200':
description: Successful
content:
application/json:
schema:
$ref: '#/components/schemas/OfferRepresentationModel'
'400':
description: |
Bad request - Product is not final - Not supported NFT merchant - Product type not supported - Max declared stock has been exceeded - Unable to create Pre-Order offer. Please contact Account Management - Pre-order stock limit reached - Windows and Office products cannot be sold via Wholesale - NFT products cannot be sold via Wholesale - Wholesale discount value is invalid - Wholesale tiers values are invalid - This product is restricted and cannot be sold by merchants - Minimal price limit of <price> EUR not reached for this product - Offer price must be greater than zero - Too long description - Invalid delivery time - Invalid delivery methods, it cannot contain duplicated methods
'401':
description: Unauthorized
'403':
description: Forbidden
'409':
description: Offer already created
get:
tags: - Offers
summary: Get Offers
operationId: getOffers
security: - BearerAuth: [ ]
parameters: - name: filter
in: query
description: Filter criteria for offers
schema:
$ref: '#/components/schemas/OffersFilter' - name: page
in: query
description: Pagination parameters
schema:
$ref: '#/components/schemas/Pageable'
responses:
'200':
description: Successful
content:
application/json:
schema:
$ref: '#/components/schemas/OfferWithSummaryPagedCollectionRepresentationModel'
'401':
description: Unauthorized
/api/v1/offers/{offerId}:
get:
tags: - Offers
summary: Get Offer
operationId: getOffer
security: - BearerAuth: [ ]
parameters: - name: offerId
in: path
description: ID of the offer to retrieve
required: true
schema:
type: string
responses:
'200':
description: Successful
content:
application/json:
schema:
$ref: '#/components/schemas/OfferRepresentationModel'
'401':
description: Unauthorized
'404':
description: Not found
put:
tags: - Offers
summary: Update Offer
operationId: updateOfferPut
security: - BearerAuth: [ ]
parameters: - name: offerId
in: path
description: ID of the offer to update
required: true
schema:
type: string
requestBody:
required: true
content:
application/json:
schema:
$ref: '#/components/schemas/OfferUpdateRequest'
responses:
'200':
description: Successful
content:
application/json:
schema:
$ref: '#/components/schemas/OfferRepresentationModel'
'400':
description: |
Bad request - Max declared stock has been exceeded - Windows and Office products cannot be sold via Wholesale - NFT products cannot be sold via Wholesale - Wholesale discount value is invalid - Wholesale tiers values are invalid - This product is restricted and cannot be sold by merchants - Minimal price limit of <price> EUR not reached for this product - Offer price must be greater than zero - Too long description - Invalid delivery time - Invalid delivery methods, it cannot contain duplicated methods
'401':
description: Unauthorized
'403':
description: Forbidden
'404':
description: Not found
patch:
tags: - Offers
summary: Update Offer (Patch)
operationId: updateOfferPatch
security: - BearerAuth: [ ]
parameters: - name: offerId
in: path
description: ID of the offer to update
required: true
schema:
type: string
requestBody:
required: true
content:
application/json:
schema:
$ref: '#/components/schemas/OfferUpdateRequest'
responses:
'200':
description: Successful
content:
application/json:
schema:
$ref: '#/components/schemas/OfferRepresentationModel'
'400':
description: |
Bad request - Max declared stock has been exceeded - Windows and Office products cannot be sold via Wholesale - NFT products cannot be sold via Wholesale - Wholesale discount value is invalid - Wholesale tiers values are invalid - This product is restricted and cannot be sold by merchants - Minimal price limit of <price> EUR not reached for this product - Offer price must be greater than zero
'401':
description: Unauthorized
'403':
description: Forbidden
'404':
description: Not found
/api/v1/offers/status/bulk/activate:
patch:
tags: - Offers
summary: Bulk Activate Offers
operationId: updateStatusBulkActivate
security: - BearerAuth: [ ]
requestBody:
required: true
content:
application/json:
schema:
type: array
items:
description: offers ids
type: string
responses:
'200':
description: Successful
content:
application/json:
schema:
type: array
items:
$ref: '#/components/schemas/OfferRepresentationModel'
'400':
description: |
Bad request - Max declared stock has been exceeded - Windows and Office products cannot be sold via Wholesale - NFT products cannot be sold via Wholesale - Wholesale discount value is invalid - Wholesale tiers values are invalid - This product is restricted and cannot be sold by merchants - Minimal price limit of <price> EUR not reached for this product - Offer price must be greater than zero
'401':
description: Unauthorized
'403':
description: Forbidden
/api/v1/offers/status/bulk/deactivate:
patch:
tags: - Offers
summary: Bulk Deactivate Offers
operationId: updateStatusBulkDeactivate
security: - BearerAuth: [ ]
requestBody:
required: true
content:
application/json:
schema:
type: array
items:
description: offers ids
type: string
responses:
'200':
description: Successful
content:
application/json:
schema:
type: array
items:
$ref: '#/components/schemas/OfferRepresentationModel'
'400':
description: |
Bad request - Max declared stock has been exceeded - Windows and Office products cannot be sold via Wholesale - NFT products cannot be sold via Wholesale - Wholesale discount value is invalid - Wholesale tiers values are invalid - This product is restricted and cannot be sold by merchants - Minimal price limit of <price> EUR not reached for this product - Offer price must be greater than zero
'401':
description: Unauthorized
'403':
description: Forbidden
/api/v1/offers/wholesale/bulk:
patch:
tags: - Offers
summary: Bulk Update Wholesale Options
operationId: multiUpdateWholeSaleOptions
security: - BearerAuth: [ ]
requestBody:
required: true
content:
application/json:
schema:
$ref: '#/components/schemas/WholesaleBulkRequest'
responses:
'200':
description: Successful
content:
application/json:
schema:
type: array
items:
$ref: '#/components/schemas/OfferRepresentationModel'
'400':
description: |
Bad request - Max declared stock has been exceeded - Windows and Office products cannot be sold via Wholesale - NFT products cannot be sold via Wholesale - Wholesale discount value is invalid - Wholesale tiers values are invalid - This product is restricted and cannot be sold by merchants - Minimal price limit of <price> EUR not reached for this product - Offer price must be greater than zero
'401':
description: Unauthorized
'403':
description: Forbidden
'404':
description: Not found
/api/v1/offers/calculations/priceAndCommission:
get:
tags: - Offers
summary: Calculate Merchant Commission Information
description: |
This endpoint calculates the merchant commission based on provided price or IWTR price.  
 Additionally, it performs conversions between internal and regular prices according to the commission.  
 Please note that either the **price or IWTR price must be provided**, otherwise the endpoint will return a 404 error with the message "Commission Price not found".
operationId: getPriceElements
security: - BearerAuth: [ ]
parameters: - name: brokerId
in: query
description: The broker ID
schema:
type: string
default: internal - name: kpcProductId
in: query
description: The product ID
required: true
schema:
type: string - name: priceIWTR
in: query
description: The price in IWTR (I want to receive)
schema:
type: integer
format: int64 - name: price
in: query
description: The price
schema:
type: integer
format: int64
responses:
'200':
description: Successful
content:
application/json:
schema:
$ref: '#/components/schemas/PriceElementCentsValueRepresentationModel'
'401':
description: Unauthorized
'404':
description: Commission Price not found
'409':
description: Commission Rule not found
/api/v1/offers/block-reasons:
get:
tags: - Offers
summary: Get Block Reasons
operationId: getBlockReasons
security: - BearerAuth: [ ]
responses:
'200':
description: Successful
content:
application/json:
schema:
type: array
items:
$ref: '#/components/schemas/BlockReasonCount'
'401':
description: Unauthorized
/api/v1/offers/favorites:
patch:
tags: - Offers
summary: Update Favorite
operationId: updateFavorite
security: - BearerAuth: [ ]
requestBody:
required: true
content:
application/json:
schema:
$ref: '#/components/schemas/FavoriteBulkRequest'
responses:
'200':
description: Successful
content:
application/json:
schema:
type: array
items:
$ref: '#/components/schemas/OfferDocument'
'401':
description: Unauthorized

# STOCK

/api/v1/offers/{offerId}/stock:
post:
summary: Upload Stock
description: |
Upload: - single key can have max 200KiB - key should have one of following mime type: text/plain, image/jpeg, image/png, image/gif
tags: - Stock
security: - BearerAuth: [ ]
requestBody:
required: true
content:
application/json:
schema:
$ref: '#/components/schemas/StockRequest'
parameters: - in: path
name: offerId
required: true
schema:
type: string
responses:
'200':
description: Successful
content:
application/json:
schema:
$ref: '#/components/schemas/StockRepresentationModel'
'400':
description: |
Bad request - Only text stock allowed in this offer - Invalid reservation ID (does not exist or has already been processed)
'401':
description: Unauthorized
'403':
description: Forbidden
'404':
description: Offer not found
'409':
description: |
Conflict - Reservation is being proceeded by another action now. Please try again in few seconds. - Stock already uploaded
get:
summary: Get Offer Stock
tags: - Stock
security: - BearerAuth: [ ]
parameters: - in: query
name: filter
required: false
schema:
$ref: '#/components/schemas/StockFilter' - in: path
name: offerId
required: true
schema:
type: string - in: query
name: page
required: false
schema:
$ref: '#/components/schemas/Pageable'
responses:
'200':
description: Successful
content:
application/json:
schema:
$ref: '#/components/schemas/PagedModelStockRepresentationModel'
'401':
description: Unauthorized
delete:
summary: Delete Offer Stock By Filter
tags: - Stock
security: - BearerAuth: [ ]
parameters: - in: query
name: filter
required: false
schema:
$ref: '#/components/schemas/StockFilter' - in: path
name: offerId
required: true
schema:
type: string - in: query
name: limit
required: true
schema:
type: integer
responses:
'200':
description: Successful. Returns zip file with removed stock.
content:
application/zip:
schema:
type: string
format: binary
'401':
description: Unauthorized
'403':
description: Forbidden
/api/v1/offers/{offerId}/stock/file:
post:
summary: Upload Stock with file
description: |
Endpoint for uploading stock withing single file. File should have extension .txt or .zip.

        Upload:
        - supports up to 10000 keys in file
        - single key (text or image) can have max 200KiB
        - image keys should have one of following extensions: .jpg, .jpeg, .png, .gif
      tags:
        - Stock
      security:
        - BearerAuth: [ ]
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
      parameters:
        - in: path
          name: offerId
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StockUploadResponse'
        '400':
          description: |
            Bad request
            - Unsupported file extension
            - Too many keys in file
            - Key is too big
            - Image size limit exceeded
        '401':
          description: Unauthorized
        '404':
          description: Offer not found

/api/v1/offers/{offerId}/stock/file/{uploadId}:
get:
summary: Get Upload Keys Status
tags: - Stock
security: - BearerAuth: [ ]
parameters: - in: path
name: offerId
required: true
schema:
type: string - in: path
name: uploadId
required: true
schema:
type: string
responses:
'200':
description: Successful
content:
application/json:
schema:
$ref: '#/components/schemas/StockUploadResponse'
        '401':
          description: Unauthorized
        '404':
          description: Not found
  /api/v1/offers/{offerId}/stock/list:
    post:
      summary: Upload Stock List
      description: |
        Upload:
        - single key can have max 200KiB
        - key should have one of following mime type: text/plain, image/jpeg, image/png, image/gif
      tags:
        - Stock
      security:
        - BearerAuth: [ ]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/StockRequest'
      parameters:
        - in: path
          name: offerId
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Successful
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/StockRepresentationModel'
        '400':
          description: |
            Bad request
            - Only text stock allowed in this offer
            - Invalid reservation ID (does not exist or has already been processed)
        '401':
          description: Unauthorized
        '403':
          description: Forbidden
        '404':
          description: Offer not found
        '409':
          description: |
            - Reservation is being proceeded by another action now. Please try again in few seconds
            - Stock already uploaded
  /api/v1/offers/{offerId}/stock/{stockId}:
    get:
      summary: Get Offer Stock By Id
      tags:
        - Stock
      security:
        - BearerAuth: [ ]
      parameters:
        - in: query
          name: filter
          required: false
          schema:
            $ref: '#/components/schemas/StockFilter'
        - in: path
          name: offerId
          required: true
          schema:
            type: string
        - in: path
          name: stockId
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StockRepresentationModel'
        '401':
          description: Unauthorized
        '403':
          description: Forbidden
        '404':
          description: Not found
    put:
      summary: Update Offer Stock
      tags:
        - Stock
      security:
        - BearerAuth: [ ]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/StockUpdateRequest'
      parameters:
        - in: path
          name: offerId
          required: true
          schema:
            type: string
        - in: path
          name: stockId
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StockRepresentationModel'
        '401':
          description: Unauthorized
        '403':
          description: Forbidden
        '404':
          description: Not found
    delete:
      summary: Delete Offer Stock
      tags:
        - Stock
      security:
        - BearerAuth: [ ]
      parameters:
        - in: path
          name: offerId
          required: true
          schema:
            type: string
        - in: path
          name: stockId
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StockRepresentationModel'
        '401':
          description: Unauthorized
        '403':
          description: Forbidden
        '404':
          description: Not found
  /api/v1/offers/restock:
    post:
      summary: Restock
      tags:
        - Stock
      security:
        - BearerAuth: [ ]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RestockRequest'
      responses:
        '200':
          description: Successful
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/RestockDocument'
        '401':
          description: Unauthorized
        '409':
          description: Order already restocked
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    Region:
      type: object
      properties:
        id:
          type: integer
          nullable: true
        name:
          type: string
      additionalProperties: false
    Platform:
      type: object
      properties:
        id:
          type: integer
          nullable: true
        name:
          type: string
      additionalProperties: false
    ProductType:
      type: object
      properties:
        softwareMS:
          type: boolean
        prePaid:
          type: boolean
        skinsCSGO:
          type: boolean
        randomProduct:
          type: boolean
        indieValley:
          type: boolean
        nft:
          type: boolean
        businessStore:
          type: boolean
      additionalProperties: false
    Pageable:
      type: object
      properties:
        sort:
          type: object
        pageSize:
          type: integer
        pageNumber:
          type: integer
        offset:
          type: integer
        unpaged:
          type: boolean
        paged:
          type: boolean
    Price:
      type: object
      properties:
        amount:
          type: integer
          minimum: 0
        currency:
          type: string
          pattern: ^EUR$
OfferRepresentationModel:
type: object
properties:
id:
type: string
productId:
type: string
name:
type: string
nullable: true
sellerId:
type: integer
status:
type: string
block:
type: string
nullable: true
priceIWTR:
$ref: '#/components/schemas/Price'
        price:
          $ref: '#/components/schemas/Price'
        commissionRule:
          $ref: '#/components/schemas/CommissionRuleRepresentationModel'
          nullable: true
        declaredStock:
          type: integer
        maxDeliveryDate:
          type: string
          format: date-time
          nullable: true
        declaredTextStock:
          type: integer
          nullable: true
        reservedStock:
          type: integer
        availableStock:
          type: integer
        buyableStock:
          type: integer
        updatedAt:
          type: string
          format: date-time
        createdAt:
          type: string
          format: date-time
        wholesale:
          $ref: '#/components/schemas/Wholesale'
          nullable: true
        sold:
          type: integer
        productDetails:
          $ref: '#/components/schemas/ProductDetails'
          nullable: true
        preOrder:
          type: boolean
          nullable: true
        sold1d:
          type: integer
        sold7d:
          type: integer
        sold30d:
          type: integer
        popularityBid:
          $ref: '#/components/schemas/Price'
        popularityPosition:
          type: integer
          nullable: true
        popularity:
          type: number
        buyButtonProbability:
          type: number
          nullable: true
        buyButtonBidEnabled:
          type: boolean
        hasBuyButtonDeal:
          type: boolean
        outOfStockIn1day:
          type: boolean
          nullable: true
        merchantType:
          type: string
          nullable: true
        salesBoosterActivationDate:
          type: string
          format: date-time
          nullable: true
        salesBoosterRenewal:
          type: boolean
          nullable: true
        spaActive:
          type: boolean
          nullable: true
        favorite:
          type: boolean
          nullable: true
        description:
          type: string
          nullable: true
          description: "Ingame offer description, maximum allowed character 2000"
        minQuantity:
          type: integer
          nullable: true
          description: "Ingame offer minimum quantity, cannot be negative"
        deliveryTime:
          type: string
          nullable: true
          pattern: '^([1-9]h|1[0-2]h)$'
description: "Ingame estimated delivery time, allowed values: 1h..12h"
deliveryMethods:
type: array
enum: [ "EMAIL", "FACE_TO_FACE", "GUILD_BANK", "AUCTION_HOUSE", "DIRECT_TOP_UP", "MANUAL_TOP_UP", "INSTANT", "BOOSTING_SELF_PLAY", "BOOSTING_PILOT"]
items: - EMAIL - FACE_TO_FACE - GUILD_BANK - AUCTION_HOUSE - DIRECT_TOP_UP - MANUAL_TOP_UP - INSTANT - BOOSTING_SELF_PLAY - BOOSTING_PILOT
nullable: true
description: "Ingame offer delivery methods"
productType:
type: string # ALERTS
AlertsFilter:
type: object
properties:
sellerId:
type: integer
nullable: true
status:
type: string
nullable: true
sellerName:
type: string
nullable: true
reservationId:
type: string
nullable: true
orderIncrementId:
type: string
nullable: true
name:
type: string
nullable: true
ignored:
type: boolean
nullable: true
createdAtFrom:
type: string
format: date-time
nullable: true
createdAtTo:
type: string
format: date-time
nullable: true
AlertDocument:
type: object
properties:
id:
type: string
sellerId:
type: integer
type:
$ref: '#/components/schemas/Type'
        status:
          type: string
        createdAt:
          type: string
          format: date-time
        lastStatusCheck:
          type: string
          format: date-time
        nextStatusCheck:
          type: string
          format: date-time
        source:
          $ref: '#/components/schemas/ReservationDocument'
        emailCount:
          type: integer
        ignored:
          type: boolean
    AlertDocumentPage:
      type: object
      properties:
        content:
          type: array
          items:
            $ref: '#/components/schemas/AlertDocument'
        pageable:
          $ref: '#/components/schemas/Pageable'
        totalPages:
          type: integer
        totalElements:
          type: integer
        last:
          type: boolean
        size:
          type: integer
        number:
          type: integer
        sort:
          type: object
          properties:
            sorted:
              type: boolean
            unsorted:
              type: boolean
            empty:
              type: boolean
    Type:
      type: string
      enum:
        - STOCK_NOT_UPLOADED
    # RESERVATIONS
    ReservationDocument:
      type: object
      properties:
        id:
          type: string
        orderId:
          type: string
        orderIncrementId:
          type: string
        itemPrice:
          $ref: '#/components/schemas/Price'
        price:
          $ref: '#/components/schemas/Price'
        boughtPrice:
          $ref: '#/components/schemas/Price'
        popularityBid:
          $ref: '#/components/schemas/Price'
        commissionRule:
          $ref: '#/components/schemas/CommissionRule'
        sellerId:
          type: integer
        sellerName:
          type: string
        customerId:
          type: integer
        offerId:
          type: string
        productId:
          type: string
        name:
          type: string
        preorder:
          type: boolean
        rowNumber:
          type: integer
        createdDate:
          type: string
          format: date-time
        toReleaseDate:
          type: string
          format: date-time
        outOfStockDate:
          type: string
          format: date-time
        nextAutoReleaseDate:
          type: string
          format: date-time
        releasedDate:
          type: string
          format: date-time
        releaseTryCount:
          type: integer
        releasedStockId:
          type: string
        externalStockId:
          type: string
        externalStockName:
          type: string
        externalStockVendor:
          type: string
        externalStockPrice:
          $ref: '#/components/schemas/Price'
        ktcId:
          type: string
        status:
          type: string
        orderItemId:
          type: string
        requestedKeyType:
          type: string
        errorMsg:
          type: string
        replacedTo:
          type: string
        replacedFrom:
          type: string
        wholesaleProcess:
          type: boolean
        refundedInOrderAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
        marketDetails:
          $ref: '#/components/schemas/MarketDetails'
        marketPriceDiff:
          type: integer
        marketPricePercent:
          type: number
        lastKtcStatus:
          type: string
        paymentStatus:
          type: string
        productType:
          type: string
        merchantType:
          type: string
        restoredFromArchive:
          type: boolean
        maxDeliveryDate:
          type: string
          format: date-time
        isRestocked:
          type: boolean
        orderPriceIwtr:
          $ref: '#/components/schemas/Price'
        orderBasePriceIwtr:
          $ref: '#/components/schemas/Price'
    CommissionRule:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        fixedAmount:
          type: integer
        percentValue:
          type: number
        updatedAt:
          type
    MarketDetails:
      type: object
      properties:
        id:
          type: string
          description: Unique identifier for the market details.
        sku:
          type: string
          description: Stock Keeping Unit (SKU) identifier for the market details.
        name:
          type: string
          description: Name of the market details.
        brand:
          type: string
          description: Brand of the market details.
        price:
          type: integer
          nullable: true
          description: Price of the market details.
        rulePrice:
          type: integer
          nullable: true
          description: Rule price of the market details.
        newPrice:
          type: integer
          nullable: true
          description: New price of the market details.
        rules:
          type: string
          nullable: true
          description: Rules for the market details.
        position:
          type: string
          nullable: true
          description: Position of the market details.
        percentile:
          type: integer
          nullable: true
          description: Percentile of the market details.
        leadCompetitor:
          type: string
          nullable: true
          description: Lead competitor of the market details.
        leadingCompetitorPrice:
          type: integer
          nullable: true
          description: Price of the leading competitor of the market details.
        withTaxes:
          type: boolean
          description: Indicates whether taxes are included.
    DeliveryStatusRequest:
      type: object
      properties:
        status:
          type: string
          description: The new delivery status.
          enum:
            - DELIVERED
            - CANCELED
      required:
        - status
    ReservationsFilter:
      type: object
      properties:
        sellerId:
          type: integer
          nullable: true
        sellerName:
          type: string
          nullable: true
        reservationId:
          type: string
          nullable: true
        offerId:
          type: string
          nullable: true
        productId:
          type: string
          nullable: true
        orderIncrementId:
          type: string
          nullable: true
        name:
          type: string
          nullable: true
        customerId:
          type: integer
          nullable: true
        createdDateFrom:
          type: string
          format: date-time
          nullable: true
        createdDateTo:
          type: string
          format: date-time
          nullable: true
        releasedDateFrom:
          type: string
          format: date-time
          nullable: true
        releasedDateTo:
          type: string
          format: date-time
          nullable: true
        status:
          type: string
          nullable: true
        replacedFromFlag:
          type: boolean
          nullable: true
        replacedToFlag:
          type: boolean
          nullable: true
        all:
          type: string
          nullable: true
        externalStockName:
          type: string
          nullable: true
        externalStockVendor:
          type: string
          nullable: true
        wholesale:
          type: boolean
          nullable: true
        prePurchase:
          type: boolean
          nullable: true
        maxDeliveryDateFrom:
          type: string
          format: date-time
          nullable: true
        maxDeliveryDateTo:
          type: string
          format: date-time
          nullable: true
        textKey:
          type: string
          nullable: true
    ReservationsStatsFilter:
      type: object
      properties:
        sellerId:
          type: integer
          nullable: true
        offerId:
          type: string
          nullable: true
        productId:
          type: string
          nullable: true
        createdDateFrom:
          type: string
          format: date-time
        createdDateTo:
          type: string
          format: date-time
          nullable: true
        status:
          type: string
          nullable: true
    Stats:
      type: object
      properties:
        dateToString:
          type: string
        price:
          type: integer
          nullable: true
        bid:
          type: integer
          nullable: true
        count:
          type: integer
    ReservationRepresentationModel:
      type: object
      properties:
        id:
          type: string
        orderIncrementId:
          type: string
        itemPrice:
          $ref: '#/components/schemas/Price'
        price:
          $ref: '#/components/schemas/Price'
        priceIWTR:
          $ref: '#/components/schemas/Price'
        popularityBid:
          $ref: '#/components/schemas/Price'
        commissionRule:
          $ref: '#/components/schemas/CommissionRuleRepresentationModel'
        sellerId:
          type: integer
        sellerName:
          type: string
          nullable: true
        customerId:
          type: integer
        offerId:
          type: string
        productId:
          type: string
        name:
          type: string
        rowNumber:
          type: integer
        createdDate:
          type: string
          format: date-time
        toReleaseDate:
          type: string
          format: date-time
          nullable: true
        nextAutoReleaseDate:
          type: string
          format: date-time
          nullable: true
        releasedDate:
          type: string
          format: date-time
          nullable: true
        releaseTryCount:
          type: integer
        releasedStockId:
          type: string
          nullable: true
        releasedExternalStockId:
          type: string
          nullable: true
        status:
          type: string
        orderItemId:
          type: string
          nullable: true
        maxDeliveryDate:
          type: string
          format: date-time
          nullable: true
        quantity:
          type: integer
          nullable: true
        iwtrForMinQuantity:
          type: integer
          nullable: true
        ingameAccountId:
          type: String
          nullable: true
        deliveryMethod:
          type: String
          nullable: true
        minQuantity:
          type: integer
          nullable: true
        updatedAt:
          type: string
          format: date-time
          nullable: true
    CommissionRuleRepresentationModel:
      type: object
      properties:
        id:
          type: string
        ruleName:
          type: string
        fixedAmount:
          type: integer
        percentValue:
          type: number
    PagedReservationRepresentationModel:
      type: object
      properties:
        content:
          type: array
          items:
            $ref: '#/components/schemas/ReservationRepresentationModel'
        pageable:
          $ref: '#/components/schemas/Pageable'
        totalPages:
          type: integer
        totalElements:
          type: integer
        last:
          type: boolean
        size:
          type: integer
        number:
          type: integer
        sort:
          type: object
          properties:
            sorted:
              type: boolean
            unsorted:
              type: boolean
            empty:
              type: boolean
    # WHOLESALE
    WholesaleOfferRepresentationModel:
      type: object
      properties:
        offerId:
          type: string
        productId:
          type: string
        sellerName:
          type: string
        sellerId:
          type: integer
        buyableStock:
          type: string
        maxDeliveryDate:
          type: string
          format: date-time
          nullable: true
        status:
          type: string
        price:
          $ref: '#/components/schemas/Price'
          nullable: true
        wholesale:
          $ref: '#/components/schemas/Wholesale'
          nullable: true
        name:
          type: string
          nullable: true
        productDetails:
          $ref: '#/components/schemas/ProductDetails'
          nullable: true
        minPossibleWholesalePrice:
          type: integer
          nullable: true
        spaActive:
          type: boolean
      required:
        - offerId
        - productId
        - sellerName
        - sellerId
        - buyableStock
        - status
      additionalProperties: false
    Wholesale:
      type: object
      properties:
        name:
          type: string
          nullable: true
        enabled:
          type: boolean
        tiers:
          type: array
          items:
            $ref: '#/components/schemas/WholesaleTier'
      required:
        - enabled
      additionalProperties: false
    WholesaleTier:
      type: object
      properties:
        discount:
          type: integer
        level:
          type: integer
        price:
          $ref: '#/components/schemas/Price'
          nullable: true
        priceIWTR:
          $ref: '#/components/schemas/Price'
          nullable: true
      required:
        - discount
        - level
      additionalProperties: false
    ProductDetails:
      type: object
      properties:
        metacritic:
          type: integer
          nullable: true
        region:
          $ref: '#/components/schemas/Region'
          nullable: true
        platform:
          $ref: '#/components/schemas/Platform'
          nullable: true
        imageUrl:
          type: string
          nullable: true
        softwareMS:
          type: boolean
          nullable: true
        productType:
          $ref: '#/components/schemas/ProductType'
          nullable: true
        marketingProductType:
          type: string
          nullable: true
      additionalProperties: false
    WholesaleConfigurationRepresentationModel:
      type: object
      properties:
        wholesaleVisibility:
          type: string
          enum: [ "VISIBLE", "INVISIBLE" ]
        maxWholesaleStockDisplay:
          type: integer
          nullable: true
      additionalProperties: false
    PageImplWholesaleOfferRepresentationModel:
      type: object
      properties:
        content:
          type: array
          items:
            $ref: '#/components/schemas/WholesaleOfferRepresentationModel'
        pageable:
          $ref: '#/components/schemas/Pageable'
        totalPages:
          type: integer
        totalElements:
          type: integer
        last:
          type: boolean
        size:
          type: integer
        number:
          type: integer
        sort:
          type: object
          properties:
            sorted:
              type: boolean
            unsorted:
              type: boolean
            empty:
              type: boolean
      required:
        - content
        - pageable
        - totalPages
        - totalElements
        - last
        - size
        - number
        - sort
      additionalProperties: false
    WholesaleRequest:
      type: object
      properties:
        name:
          type: string
          nullable: true
        enabled:
          type: boolean
        tiers:
          type: array
          items:
            $ref: '#/components/schemas/WholesaleTierRequest'
      required:
        - enabled
      additionalProperties: false
    WholesaleTierRequest:
      type: object
      properties:
        discount:
          type: integer
        level:
          type: integer
        price:
          $ref: '#/components/schemas/Price'
        priceIWTR:
          $ref: '#/components/schemas/Price'
      required:
        - discount
        - level
        - price
        - priceIWTR
      additionalProperties: false
    # MERCHANTS
    SellerRepresentationModel:
      type: object
      properties:
        type:
          $ref: '#/components/schemas/MerchantDocumentType'
        status:
          type: string
      required:
        - type
        - status
    MerchantRequest:
      type: object
      properties:
        name:
          type: string
        type:
          type: string
          pattern: ^C2C|MERCHANT$
required: - name - type
MerchantDocument:
type: object
properties:
id:
type: integer
name:
type: string
status:
type: string
maxDeclaredStock:
type: integer
maxPreOrderStock:
type: integer
statusStockOnReturn:
type: string
updatedAt:
type: string
format: date-time
createdAt:
type: string
format: date-time
offerBlockRuleMax24hReports:
type: integer
nullable: true
offerBlockRuleMax24hPercent:
type: integer
nullable: true
offerBlockRulesForProducts:
type: array
items:
$ref: '#/components/schemas/OfferBlockRulesForProducts'
testAccount:
type: boolean
payoutAfterDays:
type: integer
nullable: true
wholesaler:
type: boolean
wholesaleVisibility:
$ref: '#/components/schemas/WholesaleVisibility'
gameAccountSeller:
type: boolean
maxWholesaleStockDisplay:
type: integer
nullable: true
merchantStatistics:
$ref: '#/components/schemas/MerchantStatistics'
initial:
$ref: '#/components/schemas/MerchantInitialData'
nullable: true
nextAutoRefreshSoldDate:
type: string
format: date-time
nullable: true
autoUnBlockEligible:
type: boolean
internalMerchant:
type: boolean
type:
$ref: '#/components/schemas/MerchantDocumentType'
nullable: true
email:
type: string
nullable: true
merchantArchivedStatistics:
$ref: '#/components/schemas/MerchantArchivedStatistics'
nullable: true
citizenshipCountryCode:
type: string
nullable: true
certificateOfIncorporationCountryCode:
type: string
nullable: true
tierLevel:
$ref: '#/components/schemas/TierLevel'
nullable: true
nextOOSWarningEmailDate:
type: string
format: date-time
nullable: true
priceCurrencyExchange:
type: boolean
nullable: true
acquisitionSource:
type: string
nullable: true
profiles:
type: array
items:
type: string
OfferBlockRulesForProducts:
type: object
properties:
productId:
type: string
offerBlockRuleMax24hReports:
type: integer
offerBlockRuleMax24hPercent:
type: integer

      WholesaleVisibility:
        type: string
        enum:
          - NONE
          - PARTIAL
          - FULL
    MerchantStatistics:
      type: object
      properties:
        soldReservationsCount:
          type: integer
        completedOrders:
          type: integer
        last90dAlerts:
          type: integer
        last90dSoldReservations:
          type: integer
        last90dRefundedReservations:
          type: integer
        last90dReplacedReservations:
          type: integer
        keyIssue90dStats:
          $ref: '#/components/schemas/KeyIssueStats'
        rating:
          type: number
        last30dSoldReservationsPrice:
          $ref: '#/components/schemas/Last30dSoldPriceStats'
    KeyIssueStats:
      type: object
      properties:
        averageResolveTime:
          type: integer
        canceledByBuyer:
          type: integer
        closed:
          type: integer
        count:
          type: integer
        discardedByAdmin:
          type: integer
        escalatedByBuyer:
          type: integer
        refundedBySeller:
          type: integer
        replacedBySeller:
          type: integer
        resolvedByAdmin:
          type: integer
        resolvedByBuyer:
          type: integer
        discardedRefundedOrReplaced:
          type: integer
        updatedAt:
          type: string
          format: date-time
        nextRefreshAt:
          type: string
          format: date-time
    Last30dSoldPriceStats:
      type: object
      properties:
        reviewOnDay:
          type: integer
        dateFrom:
          type: string
          format: date
        dateTo:
          type: string
          format: date
        actualSumOfSoldReservationsPrice:
          type: integer
        archive:
          type: array
          items:
            $ref: '#/components/schemas/ArchiveSoldPriceStats'
    ArchiveSoldPriceStats:
      type: object
      properties:
        dateFrom:
          type: string
          format: date
        dateTo:
          type: string
          format: date
        value:
          type: integer
    MerchantInitialData:
      type: object
      properties:
        positiveFeedback:
          type: integer
        negativeFeedback:
          type: integer
        neutralFeedback:
          type: integer
        rating:
          type: integer
          nullable: true
        completedOrderCount:
          type: integer
        importCreatedAt:
          type: string
          format: date-time
        importUpdatedAt:
          type: string
          format: date-time
    MerchantArchivedStatistics:
      type: object
      properties:
        soldReservationsCount:
          type: integer
    TierLevel:
      type: string
      enum:
        - LEVEL_0
        - LEVEL_1
        - LEVEL_2
        - LEVEL_3
        - LEVEL_4
        - LEVEL_5
    MerchantPublicResponse:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
    WholesaleVisibility:
      type: string
      enum:
        - NONE
        - PARTIAL
        - FULL
    MerchantDocumentType:
      type: string
      enum:
        - C2C
        - MERCHANT
        - NFT
    # PRODUCTS
    ProductMinimalPriceDocument:
      type: object
      properties:
        id:
          type: string
        price:
          $ref: '#/components/schemas/Price'
    # OFFERS
    OfferPromotion:
      type: object
      properties:
        current:
          type: integer
          format: int64
        new:
          type: integer
          format: int64
        currentBuyButtonProbability:
          type: number
          format: float
        newBuyButtonProbability:
          type: number
          format: float
        buyButtonBidEnabled:
          type: boolean
        tier:
          $ref: '#/components/schemas/SBTier'
        nextValidBid:
          type: integer
          format: int64
    SBTier:
      type: object
      properties:
        from:
          type: integer
          format: int64
        maxDiff:
          type: number
          format: float
        entryFee:
          type: integer
          format: int64
        step:
          type: integer
          format: int64
        minBid:
          type: integer
          format: int64
    PopularityRequest:
      type: object
      properties:
        maxBid:
          type: integer
          description: bid in cents
          format: int64
          minimum: 0
        salesBoosterRenewal:
          type: boolean
      required:
        - maxBid
    OfferRequest:
      type: object
      properties:
        productId:
          type: string
          description: The ID of the product associated with the offer
        price:
          $ref: '#/components/schemas/OfferPriceRequest'
          description: The price of the offer
        status:
          type: string
          enum: [ ACTIVE, INACTIVE ]
          default: ACTIVE
          description: The status of the offer
        declaredStock:
          type: integer
          default: 0
          description: The declared stock of the offer
        declaredTextStock:
          type: integer
          nullable: true
          description: The declared text stock of the offer
        wholesale:
          $ref: '#/components/schemas/WholesaleRequest'
          nullable: true
          description: The wholesale information of the offer
        maxDeliveryDate:
          type: string
          format: date-time
          nullable: true
          description: The maximum delivery date of the offer
        description:
          type: string
          nullable: true
          description: Ingame offer description, maximum allowed character 2000
        minQuantity:
          type: integer
          nullable: true
          description: "Ingame offer minimum quantity, cannot be negative"
        deliveryTime:
          type: string
          nullable: true
          pattern: '^([1-9]h|1[0-2]h)$'
          description: "Ingame estimated delivery time, allowed values: 1h..12h"
        deliveryMethods:
          type: array
          enum: [ "EMAIL", "FACE_TO_FACE", "GUILD_BANK", "AUCTION_HOUSE", "DIRECT_TOP_UP", "MANUAL_TOP_UP", "INSTANT", "BOOSTING_SELF_PLAY", "BOOSTING_PILOT" ]
          items:
            - EMAIL
            - FACE_TO_FACE
            - GUILD_BANK
            - AUCTION_HOUSE
            - DIRECT_TOP_UP
            - MANUAL_TOP_UP
            - INSTANT
            - BOOSTING_SELF_PLAY
            - BOOSTING_PILOT
          nullable: true
          description: "Ingame offer delivery methods"
    OfferPriceRequest:
      type: object
      properties:
        amount:
          type: integer
          minimum: 0
          maximum: 1000000
          description: The amount of the offer price
        currency:
          type: string
          pattern: '^EUR$'
          description: The currency of the offer price
    OfferUpdateRequest:
      type: object
      properties:
        status:
          type: string
          pattern: '^ACTIVE|INACTIVE$'
          nullable: true
          description: The status of the offer
        price:
          $ref: '#/components/schemas/OfferPriceRequest'
          nullable: true
          description: The price of the offer
        declaredStock:
          type: integer
          nullable: true
          description: The declared stock of the offer
        maxDeliveryDate:
          type: string
          format: date-time
          nullable: true
          description: The maximum delivery date of the offer
        declaredTextStock:
          type: integer
          nullable: true
          description: The declared text stock of the offer
        wholesale:
          $ref: '#/components/schemas/WholesaleRequest'
          nullable: true
          description: The wholesale information of the offer
        description:
          type: string
          nullable: true
          description: Ingame offer description, maximum allowed character 2000
        minQuantity:
          type: integer
          nullable: true
          description: "Ingame offer minimum quantity, cannot be negative"
        deliveryTime:
          type: string
          nullable: true
          pattern: '^([1-9]h|1[0-2]h)$'
          description: "Ingame estimated delivery time, allowed values: 1h..12h"
        deliveryMethods:
          type: array
          enum: [ "EMAIL", "FACE_TO_FACE", "GUILD_BANK", "AUCTION_HOUSE", "DIRECT_TOP_UP", "MANUAL_TOP_UP", "INSTANT", "BOOSTING_SELF_PLAY", "BOOSTING_PILOT" ]
          items:
            - EMAIL
            - FACE_TO_FACE
            - GUILD_BANK
            - AUCTION_HOUSE
            - DIRECT_TOP_UP
            - MANUAL_TOP_UP
            - INSTANT
            - BOOSTING_SELF_PLAY
            - BOOSTING_PILOT
          nullable: true
          description: "Ingame offer delivery methods"
    WholesaleBulkRequest:
      type: object
      properties:
        wholesale:
          $ref: '#/components/schemas/WholesaleRequest'
          description: The wholesale information to be applied
        offersIds:
          type: array
          items:
            type: string
          description: The list of offer IDs to apply wholesale settings
    PriceElementCentsValueRepresentationModel:
      type: object
      properties:
        rule:
          type: string
          description: The rule for price elements
        priceIWTR:
          type: integer
          description: The price in IWTR
        price:
          type: integer
          description: The price
        fixedAmount:
          type: integer
          description: The fixed amount
        percentValue:
          type: number
          format: float
          description: The percentage value
    BlockReasonCount:
      type: object
      properties:
        blockReason:
          type: string
          enum:
            - ALLBLOCKED
            - BLOCKED
            - ADMIN_INVALID
            - ADMIN_REVOKE
            - ADMIN_OUT_OF_STOCK
            - ADMIN_DUPLICATE
            - ADMIN_NAD_REGION_LOCK
            - ADMIN_NAD_WRONG_PRODUCT
            - ADMIN_NAD_WRONG_PLATFORM
            - ADMIN_NAD_MISSING_LANGUAGE
            - ADMIN_NAD_MISSING_BASE_GAME
            - ADMIN_NAD_MISSING_DLC
            - ADMIN_NAD_CURRENCY_MISMATCH
            - ADMIN_NAD_EXPIRED_KEY
            - ADMIN_MISSING_CREDENTIALS
            - ADMIN_NOT_SECURE_EMAIL_DOMAIN
            - ADMIN_NON_STACKABLE_KEYS
            - ADMIN_TRIAL_KEYS
            - ADMIN_INDIE_VALLEY
            - ADMIN_NOT_MEETING_OFFER_REQUIREMENTS
            - ADMIN_INABILITY_TO_SELL_ALTERGIFTS
            - ADMIN_PRODUCT_NOT_APPROVED
            - ADMIN_TOO_HIGH_API_PRICE_SET
            - ADMIN_REDEEM_WEBSITE_DOWN
            - ADMIN_PENALTY_CHECK_TICKET
            - ADMIN_SOFTWARE_VERIFICATION_PENDING_CHECK_TICKET
            - ADMIN_RANDOM_OFFER_VERIFICATION_PENDING_CHECK_TICKET
            - ADMIN_OTHER_CHECK_TICKET
            - TOO_MANY_REPORTS_24H_CNT
            - TOO_MANY_REPORTS_PERCENTAGE_24H_CNT
            - MANUAL_VERIFICATION_INDIE_VALLEY_PRODUCT
            - MANUAL_VERIFICATION_SOFTWARE_PRODUCT
            - MANUAL_VERIFICATION_NFT_PRODUCT
            - MANUAL_VERIFICATION_PREPAID_PRODUCT
            - MANUAL_VERIFICATION_RANDOM_PRODUCT
            - STOCK_NOT_UPLOADED
            - MERCHANT_ACCOUNT_BLOCKED
            - PRODUCT_DISABLED
          description: The block reason
        count:
          type: integer
          description: The count of the block reason
    FavoriteBulkRequest:
      type: object
      properties:
        favorite:
          type: boolean
          description: The favorite status
        offersIds:
          type: array
          items:
            type: string
          description: The list of offer IDs to update favorite status
    PagedModelOfferRepresentationModel:
      type: object
      properties:
        content:
          type: array
          items:
            $ref: '#/components/schemas/OfferRepresentationModel'
        pageable:
          $ref: '#/components/schemas/Pageable'
        totalPages:
          type: integer
        totalElements:
          type: integer
        last:
          type: boolean
        size:
          type: integer
        number:
          type: integer
        sort:
          type: object
        numberOfElements:
          type: integer
        first:
          type: boolean
        empty:
          type: boolean
    LowStock:
      type: object
      properties:
        outOfStockIn1day:
          type: boolean
      required:
        - outOfStockIn1day
    OfferWholesaleCommission:
      type: object
      properties:
        level1:
          $ref: '#/components/schemas/OfferWholesaleCommissionValue'
        level2:
          $ref: '#/components/schemas/OfferWholesaleCommissionValue'
        level3:
          $ref: '#/components/schemas/OfferWholesaleCommissionValue'
        level4:
          $ref: '#/components/schemas/OfferWholesaleCommissionValue'
      required:
        - level1
        - level2
        - level3
        - level4
    OfferWholesaleCommissionValue:
      type: object
      properties:
        percentValue:
          type: number
          format: float
        fixedAmount:
          type: number
          format: float
      required:
        - percentValue
        - fixedAmount
    OfferDocument:
      type: object
      properties:
        id:
          type: string
          description: "The unique identifier for the offer."
        productId:
          type: string
          description: "The identifier of the product associated with the offer."
        name:
          type: string
          nullable: true
          description: "The name of the offer."
        sellerId:
          type: integer
          description: "The identifier of the seller."
        sellerName:
          type: string
          description: "The name of the seller."
        status:
          type: string
          description: "The status of the offer."
        block:
          type: string
          nullable: true
          description: "The block status of the offer."
        blockedAt:
          type: string
          format: date-time
          nullable: true
          description: "The date and time when the offer was blocked."
        unblockedAt:
          type: string
          format: date-time
          nullable: true
          description: "The date and time when the offer was unblocked."
        priceIWTR:
          $ref: '#/components/schemas/Price'
          description: "The price in the offer's base currency."
        price:
          $ref: '#/components/schemas/Price'
          nullable: true
          description: "The price in the offer's display currency."
        declaredStock:
          type: integer
          description: "The declared stock quantity of the offer."
        maxDeliveryDate:
          type: string
          format: date-time
          nullable: true
          description: "The maximum delivery date of the offer."
        declaredTextStock:
          type: integer
          nullable: true
          description: "The declared text stock quantity of the offer."
        reservedStock:
          type: integer
          description: "The reserved stock quantity of the offer."
        reservedTextStock:
          type: integer
          description: "The reserved text stock quantity of the offer."
        availableStock:
          type: integer
          description: "The available stock quantity of the offer."
        availableTextStock:
          type: integer
          description: "The available text stock quantity of the offer."
        buyableTextStock:
          type: integer
          description: "The buyable text stock quantity of the offer."
        buyableStock:
          type: integer
          description: "The buyable stock quantity of the offer."
        updatedAt:
          type: string
          format: date-time
          description: "The date and time when the offer was last updated."
        createdAt:
          type: string
          format: date-time
          description: "The date and time when the offer was created."
        deletedAt:
          type: string
          format: date-time
          nullable: true
          description: "The date and time when the offer was deleted."
        commissionRule:
          $ref: '#/components/schemas/CommissionRule'
          nullable: true
          description: "The commission rule associated with the offer."
        wholesale:
          $ref: '#/components/schemas/Wholesale'
          nullable: true
          description: "The wholesale information associated with the offer."
        wholesaleCommission:
          $ref: '#/components/schemas/OfferWholesaleCommission'
          nullable: true
          description: "The wholesale commission information associated with the offer."
        sold:
          type: integer
          description: "The total sold quantity of the offer."
        sold1d:
          type: integer
          description: "The sold quantity of the offer within the last 1 day."
        sold7d:
          type: integer
          description: "The sold quantity of the offer within the last 7 days."
        sold30d:
          type: integer
          description: "The sold quantity of the offer within the last 30 days."
        lowStock:
          $ref: '#/components/schemas/LowStock'
          nullable: true
          description: "The low stock information associated with the offer."
        popularity:
          type: number
          format: float
          description: "The popularity score of the offer."
        buyButtonScore:
          type: number
          format: float
          nullable: true
          description: "The buy button score of the offer."
        buyButtonProbability:
          type: number
          format: float
          nullable: true
          description: "The buy button probability of the offer."
        buyButtonForced:
          type: boolean
          description: "Indicates whether the buy button for the offer is forced."
        buyButtonBid:
          type: boolean
          description: "Indicates whether bidding is allowed for the buy button."
        buyButtonBidEnabled:
          type: boolean
          description: "Indicates whether bidding is enabled for the buy button."
        salesBoosterActivationDate:
          type: string
          format: date-time
          nullable: true
          description: "The date and time when the sales booster was activated for the offer."
        nextRefreshSalesBoosterRules:
          type: string
          format: date-time
          nullable: true
          description: "The date and time when the sales booster rules will be refreshed for the offer."
        popularityBid:
          $ref: '#/components/schemas/Price'
          description: "The popularity bid price of the offer."
        salesBoosterRenewal:
          type: boolean
          nullable: true
          description: "Indicates whether the sales booster for the offer is renewed."
        position:
          type: integer
          nullable: true
          description: "The position of the offer."

        productDetails:
          $ref: '#/components/schemas/ProductDetails'
          nullable: true
          description: "The details of the product associated with the offer."
        marketDetails:
          $ref: '#/components/schemas/MarketDetails'
          nullable: true
          description: "The market details associated with the offer."
        marketPriceDiff:
          type: integer
          nullable: true
          description: "The difference in market price for the offer."
        marketPricePercent:
          type: number
          format: float
          nullable: true
          description: "The percentage of market price for the offer."
        broker:
          type: string
          description: "The broker associated with the offer."
        preOrder:
          type: boolean
          description: "Indicates whether the offer is available for pre-order."
        prePurchase:
          type: boolean
          description: "Indicates whether the offer is available for pre-purchase."
        kinguinOfferId:
          type: string
          nullable: true
          description: "The identifier of the offer in Kinguin."
        nextAutoRefreshSoldDate:
          type: string
          format: date-time
          nullable: true
          description: "The date and time when the sold quantity will be automatically refreshed."
        productType:
          type: string
          nullable: true
          description: "The type of product associated with the offer."
        merchantType:
          type: string
          description: "The type of merchant associated with the offer."
        priceChangeCounter:
          type: integer
          description: "The counter for price changes of the offer."
        lastPriceChangeResetDate:
          type: string
          format: date-time
          nullable: true
          description: "The date and time when the last price change counter was reset."
        minPossibleWholesalePrice:
          type: integer
          nullable: true
          description: "The minimum possible wholesale price for the offer."
        spaActive:
          type: boolean
          description: "Indicates whether the Special Price Agreement is active for the offer."
        favorite:
          type: boolean
          nullable: true
          description: "Indicates whether the offer is marked as favorite."
        description:
          type: string
          nullable: true
          description: "Ingame offer description, maximum allowed character 2000"
        minQuantity:
          type: integer
          nullable: true
          description: "Ingame offer minimum quantity, cannot be negative"
        deliveryTime:
          type: string
          nullable: true
          pattern: '^([1-9]h|1[0-2]h)$'
          description: "Ingame estimated delivery time, allowed values: 1h..12h"
        deliveryMethods:
          type: array
          enum: [ "EMAIL", "FACE_TO_FACE", "GUILD_BANK", "AUCTION_HOUSE", "DIRECT_TOP_UP", "MANUAL_TOP_UP", "INSTANT", "BOOSTING_SELF_PLAY", "BOOSTING_PILOT" ]
          items:
            - EMAIL
            - FACE_TO_FACE
            - GUILD_BANK
            - AUCTION_HOUSE
            - DIRECT_TOP_UP
            - MANUAL_TOP_UP
            - INSTANT
            - BOOSTING_SELF_PLAY
            - BOOSTING_PILOT
          nullable: true
          description: "Ingame offer delivery methods"
      required:
        - id
        - productId
        - sellerId
        - sellerName
        - status
        - priceIWTR
        - declaredStock
        - updatedAt
        - createdAt
        - sold
        - sold1d
        - sold7d
        - sold30d
        - popularity
        - buyButtonForced
        - buyButtonBid
        - buyButtonBidEnabled
        - popularityBid
        - broker
    OfferWithSummaryPagedCollectionRepresentationModel:
      type: object
      properties:
        content:
          type: array
          items:
            $ref: '#/components/schemas/OfferRepresentationModel'
          description: "The list of offer representation models."
        metadata:
          $ref: '#/components/schemas/PageMetadata'
          nullable: true
          description: "Metadata for pagination."
        summary:
          $ref: '#/components/schemas/OfferListSummary'
          description: "Summary statistics for the list of offers."
    OfferListSummary:
      type: object
      properties:
        totalActive:
          type: integer
          description: "Total number of active offers."
        totalActiveWithoutStock:
          type: integer
          description: "Total number of active offers without stock."
        totalInactive:
          type: integer
          description: "Total number of inactive offers."
        totalBlock:
          type: integer
          nullable: true
          description: "Total number of blocked offers."
        totalManualVerification:
          type: integer
          nullable: true
          description: "Total number of offers under manual verification."
        totalPrePurchaseStock:
          type: integer
          nullable: true
          description: "Total number of offers with pre-purchase stock."
        OfferListSummaryBlock:
          $ref: '#/components/schemas/OfferListSummaryBlock'
          nullable: true
          description: "Summary statistics for blocked offers."
        totalSpaActive:
          type: integer
          description: "Total number of offers with active Special Price Agreement."
        totalFavorite:
          type: integer
          description: "Total number of favorite offers."
    OfferListSummaryBlock:
      type: object
      properties:
        total:
          type: integer
          description: "Total number of blocked offers."
        totalBlock:
          type: integer
          description: "Total number of offers blocked."
        totalManualVerification:
          type: integer
          description: "Total number of offers under manual verification."
        totalTooManyReports24H:
          type: integer
          description: "Total number of offers with too many reports in the last 24 hours."
        totalStockNotUploaded:
          type: integer
          description: "Total number of offers with stock not uploaded."
    PageMetadata:
      type: object
      properties:
        page:
          type: integer
          description: "Page number."
        size:
          type: integer
          description: "Page size."
        totalElements:
          type: integer
          description: "Total number of elements."
        totalPages:
          type: integer
          description: "Total number of pages."

# STOCK

    StockRequest:
      type: object
      properties:
        body:
          type: string
          minLength: 1
          description: The body of the stock request
        mimeType:
          type: string
          minLength: 1
          description: The MIME type of the stock request
        requestId:
          type: string
          minLength: 1
          maxLength: 36
          nullable: true
          description: The request ID
        externalId:
          type: string
          nullable: true
          description: The external ID
        externalName:
          type: string
          nullable: true
          description: The external name
        externalVendor:
          type: string
          nullable: true
          description: The external vendor
        externalPrice:
          $ref: '#/components/schemas/ExternalStockPriceRequest'
          description: The external price
        reservationId:
          type: string
          nullable: true
          description: The reservation ID
      required:
        - body
        - mimeType
    ExternalStockPriceRequest:
      type: object
      properties:
        amount:
          type: integer
          description: The amount
        currency:
          type: string
          pattern: ^EUR$
          description: The currency
    StockRepresentationModel:
      type: object
      properties:
        id:
          type: string
          description: The ID of the stock
        productId:
          type: string
          description: The product ID
        offerId:
          type: string
          description: The offer ID
        sellerId:
          type: integer
          description: The seller ID
        status:
          type: string
          description: The status of the stock
        createdAt:
          type: string
          format: date-time
          description: The creation date and time
        dispatchedAt:
          type: string
          format: date-time
          nullable: true
          description: The dispatch date and time
        reservationId:
          type: string
          nullable: true
          description: The reservation ID
        ktcId:
          type: string
          nullable: true
          description: The KTC ID
        content:
          type: string
          nullable: true
          description: The content of the stock
        mimeType:
          type: string
          nullable: true
          description: The MIME type of the stock
        externalName:
          type: string
          nullable: true
          description: The external name
        externalVendor:
          type: string
          nullable: true
          description: The external vendor
        externalPrice:
          $ref: '#/components/schemas/Price'
          nullable: true
          description: The external price
        hidden:
          type: boolean
          description: Indicates if the stock is hidden
    StockFilter:
      type: object
      properties:
        status:
          type: string
          nullable: true
          description: The status of the stock
        offerId:
          type: string
          nullable: true
          description: The offer ID
        sellerId:
          type: integer
          nullable: true
          description: The seller ID
        reservationId:
          type: string
          nullable: true
          description: The reservation ID
        dispatchedAtFrom:
          type: string
          format: date-time
          nullable: true
          description: The dispatched date and time from
        dispatchedAtTo:
          type: string
          format: date-time
          nullable: true
          description: The dispatched date and time to
        ktcId:
          type: string
          nullable: true
          description: The KTC ID
        createdAtFrom:
          type: string
          format: date-time
          nullable: true
          description: The created date and time from
        createdAtTo:
          type: string
          format: date-time
          nullable: true
          description: The created date and time to
        textKey:
          type: string
          nullable: true
          description: The text key
        imageKey:
          type: string
          nullable: true
          description: The image key
        mimeType:
          type: string
          nullable: true
          description: The MIME type
        externalName:
          type: string
          nullable: true
          description: The external name
        externalVendor:
          type: string
          nullable: true
          description: The external vendor
        internalSeller:
          type: boolean
          nullable: true
          description: Indicates if the seller is internal
    StockUploadResponse:
      type: object
      properties:
        id:
          type: string
          description: The ID of the upload response
        status:
          type: string
          description: The status of the upload response
        details:
          type: string
          description: The details of the upload response
    StockUpdateRequest:
      type: object
      properties:
        status:
          type: string
          pattern: ^AVAILABLE|DISABLED$
          description: The status of the update request
    RestockRequest:
      type: object
      properties:
        orderIncrementId:
          type: string
          description: The order increment ID
        offers:
          type: array
          items:
            $ref: '#/components/schemas/OffersWithQuantityToRestock'
          description: The offers to restock
    OffersWithQuantityToRestock:
      type: object
      properties:
        offerId:
          type: string
          description: The ID of the offer to restock
        keysNumber:
          type: integer
          description: The number of keys to restock
    RestockDocument:
      type: object
      properties:
        id:
          type: string
          description: The ID of the restock document
        orderIncrementId:
          type: string
          description: The order increment ID
        offerId:
          type: string
          description: The ID of the offer
        keysNumber:
          type: integer
          description: The number of keys
        userId:
          type: integer
          description: The ID of the user
        status:
          type: string
          description: The status of the restock
        createdAt:
          type: string
          format: date-time
          description: The creation date and time
        updatedAt:
          type: string
          format: date-time
          nullable: true
          description: The update date and time
        restockedKeys:
          type: integer
          description: The number of restocked keys
        remainingToRestock:
          type: integer
          description: The remaining keys to restock
        cancelledKeys:
          type: integer
          description: The number of cancelled keys
    PagedModelStockRepresentationModel:
      type: object
      properties:
        content:
          type: array
          items:
            $ref: '#/components/schemas/StockRepresentationModel'
          description: The list of stock representation models
        metadata:
          $ref: '#/components/schemas/PageMetadata'
          description: The metadata for the paged model
