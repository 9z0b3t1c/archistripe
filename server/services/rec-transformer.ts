// RealEstateCore data transformer
// Converts extracted property data to REC-compliant JSON-LD structure

import { ExtractedPropertyData } from './grok';

export interface RECJsonLD {
  "@context": {
    "@base": string;
    "rec": string;
    "rdfs": string;
    "rdf": string;
  };
  "@type": string;
  "@id": string;
  "rdfs:label"?: string;
  "rec:hasAddress"?: RECAddress;
  "rec:hasPart"?: RECSpace[];
  "rec:hasAsset"?: RECAsset[];
  "rec:hasArea"?: RECArea;
  "rec:hasValue"?: RECValue;
  "rec:constructedIn"?: string;
  [key: string]: any;
}

export interface RECAddress {
  "@type": "rec:Address";
  "rec:streetAddress"?: string;
  "rec:city"?: string;
  "rec:state"?: string;
  "rec:postalCode"?: string;
  "rec:country"?: string;
}

export interface RECSpace {
  "@type": string; // rec:Room, rec:Level, etc.
  "@id": string;
  "rdfs:label"?: string;
  "rec:hasRoomType"?: string;
  "rec:hasArea"?: RECArea;
  "rec:hasPart"?: RECSpace[];
}

export interface RECAsset {
  "@type": string; // rec:Equipment, rec:System, etc.
  "@id": string;
  "rdfs:label"?: string;
  "rec:equipmentType"?: string;
  "rec:hasCapability"?: RECCapability[];
}

export interface RECCapability {
  "@type": string; // rec:SensingCapability, rec:ActuationCapability
  "@id": string;
  "rec:capabilityType"?: string;
}

export interface RECArea {
  "@type": "rec:Area";
  "rec:value": number;
  "rec:unit": string; // rec:SquareFoot, rec:SquareMeter, etc.
}

export interface RECValue {
  "@type": "rec:MonetaryValue";
  "rec:amount": number;
  "rec:currency": string;
}

export function transformToREC(
  propertyData: ExtractedPropertyData,
  documentId: string,
  fileName: string
): RECJsonLD {
  const baseId = `building_${documentId.slice(0, 8)}`;
  
  const recData: RECJsonLD = {
    "@context": {
      "@base": `https://our-app.com/data#`,
      "rec": "https://w3id.org/rec/",
      "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
      "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    },
    "@type": determineRECBuildingType(propertyData.propertyType || propertyData.propertyDetails?.propertyType),
    "@id": baseId,
    "rdfs:label": `${propertyData.address || propertyData.basicPropertyInfo?.address || 'Property'} - ${fileName}`
  };

  // Add address information - check nested structure first
  const address = propertyData.address || propertyData.basicPropertyInfo?.address;
  const city = propertyData.city || propertyData.basicPropertyInfo?.city;
  const state = propertyData.state || propertyData.basicPropertyInfo?.state;
  const zipCode = propertyData.zipCode || propertyData.basicPropertyInfo?.zipCode;
  
  if (address || city || state || zipCode) {
    recData["rec:hasAddress"] = {
      "@type": "rec:Address",
      ...(address && { "rec:streetAddress": address }),
      ...(city && { "rec:city": city }),
      ...(state && { "rec:state": state }),
      ...(zipCode && { "rec:postalCode": zipCode })
    };
  }

  // Add building area - check nested structure
  const squareFootage = propertyData.squareFootage || propertyData.propertyDetails?.squareFootage;
  if (squareFootage) {
    recData["rec:hasArea"] = {
      "@type": "rec:Area",
      "rec:value": squareFootage,
      "rec:unit": "rec:SquareFoot"
    };
  }

  // Add monetary value - check nested structure
  const price = propertyData.price || propertyData.propertyDetails?.price || propertyData.propertyDetails?.listPrice;
  if (price) {
    recData["rec:hasValue"] = {
      "@type": "rec:MonetaryValue",
      "rec:amount": parseFloat(price.toString()),
      "rec:currency": "USD"
    };
  }

  // Add construction year - check nested structure
  const yearBuilt = propertyData.yearBuilt || propertyData.propertyDetails?.yearBuilt;
  if (yearBuilt) {
    recData["rec:constructedIn"] = yearBuilt.toString();
  }

  // Add spaces (rooms)
  const spaces: RECSpace[] = [];
  
  // Add bedrooms - check nested structure
  const bedrooms = propertyData.bedrooms || propertyData.propertyDetails?.bedrooms;
  if (bedrooms && bedrooms > 0) {
    for (let i = 1; i <= bedrooms; i++) {
      spaces.push({
        "@type": "rec:Room",
        "@id": `${baseId}_bedroom_${i}`,
        "rdfs:label": `Bedroom ${i}`,
        "rec:hasRoomType": "rec:Bedroom"
      });
    }
  }

  // Add bathrooms - check nested structure
  const bathrooms = propertyData.bathrooms || propertyData.propertyDetails?.bathrooms;
  if (bathrooms && bathrooms > 0) {
    const fullBaths = Math.floor(bathrooms);
    const halfBaths = (bathrooms % 1) > 0 ? 1 : 0;
    
    for (let i = 1; i <= fullBaths; i++) {
      spaces.push({
        "@type": "rec:Room",
        "@id": `${baseId}_bathroom_${i}`,
        "rdfs:label": `Bathroom ${i}`,
        "rec:hasRoomType": "rec:Bathroom"
      });
    }
    
    if (halfBaths > 0) {
      spaces.push({
        "@type": "rec:Room",
        "@id": `${baseId}_half_bath`,
        "rdfs:label": "Half Bathroom",
        "rec:hasRoomType": "rec:HalfBathroom"
      });
    }
  }

  if (spaces.length > 0) {
    recData["rec:hasPart"] = spaces;
  }

  // Add assets/equipment
  const assets: RECAsset[] = [];

  // Add HVAC if mentioned
  if (propertyData.airConditioning || propertyData.heating) {
    assets.push({
      "@type": "rec:Equipment",
      "@id": `${baseId}_hvac`,
      "rdfs:label": "HVAC System",
      "rec:equipmentType": "rec:AirHandlingUnit"
    });
  }

  // Add garage as asset
  if (propertyData.garage && propertyData.garage !== 'none') {
    assets.push({
      "@type": "rec:Asset",
      "@id": `${baseId}_garage`,
      "rdfs:label": "Garage",
      "rec:equipmentType": "rec:ParkingSpace"
    });
  }

  // Add pool if present
  if (propertyData.pool) {
    assets.push({
      "@type": "rec:Asset",
      "@id": `${baseId}_pool`,
      "rdfs:label": "Swimming Pool",
      "rec:equipmentType": "rec:RecreationalFacility"
    });
  }

  if (assets.length > 0) {
    recData["rec:hasAsset"] = assets;
  }

  return recData;
}

function determineRECBuildingType(propertyType?: string | any): string {
  // Handle nested property type structure
  let type: string;
  if (typeof propertyType === 'string') {
    type = propertyType.toLowerCase();
  } else if (propertyType?.propertyType) {
    type = propertyType.propertyType.toLowerCase();
  } else {
    return "rec:Building";
  }
  
  if (type.includes('house') || type.includes('single') || type.includes('family')) {
    return "rec:SingleFamilyHouse";
  } else if (type.includes('condo') || type.includes('apartment')) {
    return "rec:Apartment";
  } else if (type.includes('townhouse') || type.includes('town')) {
    return "rec:Townhouse";
  } else if (type.includes('commercial') || type.includes('office')) {
    return "rec:OfficeBuilding";
  } else if (type.includes('retail') || type.includes('store')) {
    return "rec:RetailBuilding";
  } else if (type.includes('industrial')) {
    return "rec:IndustrialBuilding";
  }
  
  return "rec:Building";
}

export function validateRECData(recData: RECJsonLD): boolean {
  // Basic validation of REC JSON-LD structure
  return !!(
    recData["@context"] &&
    recData["@type"] &&
    recData["@id"] &&
    recData["@context"]["rec"] === "https://w3id.org/rec/"
  );
}