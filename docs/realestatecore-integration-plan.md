# RealEstateCore Integration Plan

## Overview

This document outlines the plan to integrate RealEstateCore (REC) ontology into our real estate document analysis application. REC provides a standardized, semantic schema that will enhance data interoperability and provide rich relationship modeling.

## Benefits of REC Integration

1. **Standardization**: Industry-standard schema used by major platforms (ProptechOS, WillowTwin)
2. **Interoperability**: Automatic compatibility with other REC users
3. **Rich Semantics**: Complex relationships and hierarchies built-in
4. **Future-Proof**: Active development with version 3.3 and ongoing community support
5. **Multi-Format Support**: SHACL/RDF, DTDL, JSON-LD implementations available

## Implementation Phases

### Phase 1: Schema Enhancement (Current Priority)
- Extend existing schema to include REC-compliant JSON-LD structure
- Add REC context and type annotations to property data
- Maintain backward compatibility with current flat schema

### Phase 2: Data Model Migration
- Implement REC spatial hierarchy (RealEstate → Building → Space)
- Add Asset modeling for equipment and systems
- Integrate Capability model for sensor/device representations

### Phase 3: Full REC Adoption
- Replace custom schema with native REC implementation
- Add support for building topology and equipment relationships
- Implement REC REST API patterns

## Technical Implementation

### Current Schema → REC Mapping

#### Basic Property Information
```
Current: address, city, state, zipCode
REC: Space → Building → hasAddress, isPartOf (Region)
```

#### Property Details
```
Current: propertyType, squareFootage, bedrooms, bathrooms
REC: Building → hasSpaceType, hasArea, Room → hasRoomType
```

#### Financial Data
```
Current: price, taxes, hoa
REC: Asset → hasValue, Building → hasOperationalCost
```

#### Equipment & Features
```
Current: garage, pool, fireplace
REC: Asset → Equipment → specific equipment types
```

### JSON-LD Structure Example

```json
{
  "@context": {
    "@base": "https://our-app.com/data#",
    "rec": "https://w3id.org/rec/",
    "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
  },
  "@type": "rec:Building",
  "@id": "building_123",
  "rdfs:label": "123 Oak Street Property",
  "rec:hasAddress": {
    "@type": "rec:Address",
    "rec:streetAddress": "123 Oak Street",
    "rec:city": "San Francisco",
    "rec:state": "CA",
    "rec:postalCode": "94102"
  },
  "rec:hasPart": [
    {
      "@type": "rec:Room",
      "@id": "bedroom_1",
      "rec:hasRoomType": "rec:Bedroom",
      "rec:hasArea": {
        "@type": "rec:Area",
        "rec:value": 150,
        "rec:unit": "rec:SquareFoot"
      }
    }
  ],
  "rec:hasAsset": [
    {
      "@type": "rec:Equipment",
      "@id": "hvac_system",
      "rec:equipmentType": "rec:AirHandlingUnit"
    }
  ]
}
```

### Database Schema Evolution

#### Option 1: Hybrid Approach (Recommended)
- Keep existing flat schema for query performance
- Add REC-compliant JSON-LD in `rawExtractedData` field
- Create views/transforms for REC API compatibility

#### Option 2: Full REC Schema
- Replace current schema with REC-native structure
- Use graph database capabilities (PostgreSQL supports JSON graphs)
- Implement semantic querying capabilities

## Integration Steps

### Step 1: Enhanced Grok Extraction
Update Grok prompts to extract REC-compatible data structures:
- Spatial hierarchy information
- Equipment and asset details
- Relationship mappings
- REC type classifications

### Step 2: Schema Extension
Add REC JSON-LD support to existing schema:
```sql
ALTER TABLE property_data ADD COLUMN rec_data JSONB;
CREATE INDEX idx_property_data_rec ON property_data USING GIN (rec_data);
```

### Step 3: API Enhancement
Provide REC-compliant endpoints:
- `/api/rec/buildings` - REC Building entities
- `/api/rec/spaces` - Spatial hierarchy
- `/api/rec/assets` - Equipment and systems
- Content-Type: `application/ld+json`

### Step 4: UI Enhancement
Update document viewer to display REC structured data:
- Hierarchical space visualization
- Equipment/asset relationships
- Semantic property groupings

## Timeline

- **Week 1**: Schema enhancement and Grok integration
- **Week 2**: REC JSON-LD generation and storage
- **Week 3**: API endpoints and data transformation
- **Week 4**: UI updates and testing

## Compatibility Considerations

1. **Backward Compatibility**: Existing API endpoints remain functional
2. **Migration Path**: Gradual transition with dual support
3. **Performance**: Index REC data for efficient querying
4. **Validation**: JSON Schema validation for REC compliance

## Benefits Realization

1. **Data Exchange**: Easy integration with other REC-compliant systems
2. **Rich Queries**: Semantic relationships enable complex property searches
3. **Industry Standard**: Alignment with PropTech ecosystem standards
4. **Future Extensions**: Easy addition of IoT, BIM, and facility management features

## Next Steps

1. Update Grok extraction to include REC classifications
2. Extend current schema with REC JSON-LD support
3. Implement REC data transformation layer
4. Create REC-compliant API endpoints
5. Update UI to display rich semantic relationships