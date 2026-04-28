# Postman Collection for Investors Clinic API

## Files

1. **Investors_Clinic_API.postman_collection.json** - Complete API collection
2. **Investors_Clinic_Environment.postman_environment.json** - Environment variables

## Setup

1. **Import Collection**
   - Open Postman
   - Click Import
   - Select `Investors_Clinic_API.postman_collection.json`

2. **Import Environment** (Optional but recommended)
   - Click Import
   - Select `Investors_Clinic_Environment.postman_environment.json`
   - Select "Investors Clinic - Local" environment from dropdown

3. **Update Environment Variables**
   - `base_url`: Default is `http://localhost:3000` (update if different)
   - `user_id`: Default is `user123` (update with your test user ID)

## Endpoints Included

### Properties
- GET `/api/v1/properties` - Discovery with filters
- GET `/api/v1/properties/:id` - Get property by ID

### Value Check
- POST `/api/v1/value-check` - With quoted price
- POST `/api/v1/value-check` - Market range only (no quoted price)
- Error cases: Invalid sector, missing fields

### Compare
- POST `/api/v1/compare` - Compare two properties
- Error cases: Same property, property not found

### Saved Properties
- POST `/api/v1/saved-properties` - Save property (requires X-User-Id header)
- GET `/api/v1/saved-properties` - Get saved properties (requires X-User-Id header)
- Error cases: Missing header, property not found

## Important Notes

1. **Sector Constraint**: All requests must use `"Sector 150"` as sector value
2. **Property IDs**: Replace `property-id-from-seed` with actual IDs from your seeded database
3. **X-User-Id Header**: Required for saved properties endpoints (set in environment variable)
4. **Error Responses**: Collection includes example error responses (400, 404)

## Testing Workflow

1. **Get Properties**: Start with GET `/api/v1/properties` to see available properties
2. **Get Property IDs**: Copy property IDs from the response
3. **Update Collection**: Replace placeholder IDs in compare and save requests
4. **Test Value Check**: Try different quoted prices to see different verdicts
5. **Test Saved Properties**: Set `user_id` environment variable and test save/get

## Example Request Values

Based on seeded database (Sector 150, Noida):

- **Sector**: `"Sector 150"` (required, only supported value)
- **BHK**: `2`, `3`, or `4`
- **Property Type**: `"flat"` or `"plot"`
- **Sample Sizes**: 1000 sqft (2BHK), 1400 sqft (3BHK), 2000 sqft (4BHK)
- **Sample Prices**: 4500000 - 12100000 (based on seed data)

## Verdict Examples

- **Within market**: `quoted_price <= band_total_high`
- **Slightly high**: `band_total_high < quoted_price <= band_total_high * 1.15`
- **Aggressive**: `quoted_price > band_total_high * 1.15`
- **Market range only**: When `quoted_price` is not provided

## Reason Codes

Possible reason codes (max 3 per response):
- `RECENT_LOWER_DEALS`, `RECENT_HIGHER_DEALS`
- `HIGH_SUPPLY`, `LOW_SUPPLY`
- `SIZE_PREMIUM`, `FLOOR_PREMIUM`, `BUILDER_PREMIUM`
- `UNDER_CONSTRUCTION_DISCOUNT`
- `MARKET_ALIGNMENT` (only when confidence is not low)
- `LOCATION_ADVANTAGE`

## Risk Flags

- `LOW`: High confidence, price within range
- `MEDIUM`: Moderate confidence or price slightly above range
- `HIGH`: Low confidence or price significantly above range
