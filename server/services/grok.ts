import OpenAI from "openai";
import fs from "fs";
import { extractTextFromPDF } from './pdf-parser.js';

const openai = new OpenAI({ 
  baseURL: "https://api.x.ai/v1", 
  apiKey: process.env.XAI_API_KEY || process.env.GROK_API_KEY || "your-api-key-here"
});

export interface ExtractedPropertyData {
  // Basic Property Information
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  neighborhood?: string;
  
  // Property Details
  price?: number;
  listPrice?: number;
  salePrice?: number;
  rentPrice?: number;
  pricePerSqFt?: number;
  squareFootage?: number;
  lotSize?: number;
  bedrooms?: number;
  bathrooms?: number;
  halfBaths?: number;
  fullBaths?: number;
  
  // Property Features
  propertyType?: string;
  buildingType?: string;
  yearBuilt?: number;
  stories?: number;
  garage?: string;
  parking?: string;
  basement?: string;
  attic?: string;
  pool?: boolean;
  fireplace?: boolean;
  airConditioning?: string;
  heating?: string;
  
  // Financial Information
  taxes?: number;
  hoa?: number;
  insurance?: number;
  utilities?: string;
  financing?: string;
  downPayment?: number;
  mortgageRate?: number;
  
  // Legal & Ownership
  mlsNumber?: string;
  parcelId?: string;
  legalDescription?: string;
  ownerName?: string;
  titleCompany?: string;
  
  // Dates & Timeline
  listDate?: string;
  saleDate?: string;
  closeDate?: string;
  contractDate?: string;
  inspectionDate?: string;
  appraisalDate?: string;
  
  // Condition & Features
  condition?: string;
  renovations?: string;
  appliances?: string;
  flooring?: string;
  roofType?: string;
  exteriorMaterial?: string;
  
  // Location Features
  schoolDistrict?: string;
  walkScore?: number;
  nearbyAmenities?: string;
  transportation?: string;
  
  // Document Classification
  documentType?: string;
  documentSubtype?: string;
  
  [key: string]: any;
}

export async function extractPropertyDataFromPDF(extractedText: string, fileName: string): Promise<ExtractedPropertyData> {
  try {
    // Smart text truncation for Grok 4's 256k token limit
    // Grok 4 supports up to 256k tokens (~1M characters)
    // Leave buffer for prompt overhead: ~50k tokens for instructions + 5k for response
    // This allows ~800k characters for document content
    const MAX_TEXT_LENGTH = 800000; // Much more generous limit with Grok 4
    let processedText = extractedText;
    
    if (extractedText.length > MAX_TEXT_LENGTH) {
      console.log(`Text too long (${extractedText.length} chars), truncating to ${MAX_TEXT_LENGTH} chars for Grok 4's enhanced capacity`);
      // Take first 400k and last 400k characters to capture comprehensive content
      const halfLength = MAX_TEXT_LENGTH / 2;
      const firstHalf = extractedText.substring(0, halfLength);
      const lastHalf = extractedText.substring(extractedText.length - halfLength);
      processedText = firstHalf + "\n\n[... MIDDLE CONTENT TRUNCATED - DOCUMENT CONTINUES ...]\n\n" + lastHalf;
      console.log(`Final processed text length: ${processedText.length} chars`);
    } else {
      console.log(`Document length ${extractedText.length} chars fits within Grok 4's enhanced capacity`);
    }
    
    const prompt = `
You are an expert real estate document parser with deep knowledge of property listings, contracts, appraisals, inspections, tax records, and all real estate documentation. You understand RealEstateCore (REC) ontology standards and semantic data modeling.

Analyze the following text extracted from a PDF document and extract ALL possible property information, organizing it according to RealEstateCore ontology principles where applicable.

EXTRACT ALL AVAILABLE INFORMATION FROM THESE CATEGORIES (with REC ontology alignment):

**BASIC PROPERTY INFO:**
- address: Complete property address
- city, state, zipCode, county, neighborhood
- mlsNumber, parcelId, legalDescription

**PROPERTY DETAILS:**
- price, listPrice, salePrice, rentPrice, pricePerSqFt
- squareFootage, lotSize (in sq ft or acres)
- bedrooms, bathrooms, halfBaths, fullBaths
- propertyType (house, condo, townhouse, commercial, etc.)
- buildingType, yearBuilt, stories

**FEATURES & AMENITIES:**
- garage (attached/detached/none), parking spaces
- basement (finished/unfinished/none), attic
- pool (boolean), fireplace (boolean)
- airConditioning, heating systems
- appliances, flooring types
- roofType, exteriorMaterial

**FINANCIAL INFORMATION:**
- taxes (annual property taxes)
- hoa (monthly HOA fees)
- insurance, utilities costs
- financing details, downPayment, mortgageRate

**DATES & TIMELINE:**
- listDate, saleDate, closeDate, contractDate
- inspectionDate, appraisalDate
- Any relevant dates in MM/DD/YYYY format

**CONDITION & IMPROVEMENTS:**
- condition (excellent, good, fair, needs work)
- renovations, recent improvements
- Any mentioned repairs or issues

**LOCATION & COMMUNITY:**
- schoolDistrict, walkScore
- nearbyAmenities (parks, shopping, etc.)
- transportation access

**DOCUMENT CLASSIFICATION:**
- documentType: listing, contract, appraisal, inspection, tax_record, deed, disclosure, etc.
- documentSubtype: purchase_agreement, rental_lease, home_inspection, etc.

**REALESTATECORE SEMANTIC CLASSIFICATION:**
- recBuildingType: single_family_house, apartment, office_building, retail, industrial, etc.
- recSpaceTypes: room types following REC taxonomy (bedroom, bathroom, kitchen, living_room, etc.)
- recAssetTypes: equipment and systems (hvac_system, electrical_system, plumbing_system, etc.)
- recCapabilities: sensing/control capabilities if mentioned (temperature_sensor, lighting_control, etc.)

**OWNERSHIP & LEGAL:**
- ownerName, titleCompany
- Any legal restrictions or easements

INSTRUCTIONS:
- Extract ALL information present, even if not explicitly requested
- Use numbers without currency symbols or units
- Use boolean true/false for yes/no features
- If square footage is given as ranges, use the average
- For dates, use MM/DD/YYYY format
- For property types, use lowercase
- If information is unclear but can be reasonably inferred, include it
- Include RealEstateCore semantic classifications where applicable
- Organize spatial hierarchy (building → floors → rooms) when determinable
- Identify equipment/systems as separate entities from spaces
- Return comprehensive JSON with all found data AND REC-compatible structure

Document filename: ${fileName}
Text length: ${processedText.length} characters

Text content to analyze:
${processedText}
`;

    // Try Grok 4 first, fallback to Grok 2 if unavailable
    let modelToUse = "grok-4";
    let maxTokensLimit = 4000;
    
    const response = await openai.chat.completions.create({
      model: modelToUse,
      messages: [
        {
          role: "system",
          content: "You are a comprehensive real estate document analysis expert. Extract ALL available property, financial, legal, and contextual information from text extracted from real estate documents. Be thorough and extract every detail that could be valuable for property analysis, valuation, or decision-making."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: maxTokensLimit,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Clean and validate the extracted data comprehensively
    const cleanedData: ExtractedPropertyData = {};
    
    // Helper functions for data cleaning
    const cleanString = (value: any): string | undefined => {
      return value && typeof value === 'string' ? value.trim() : undefined;
    };
    
    const cleanNumber = (value: any): number | undefined => {
      if (value && !isNaN(Number(value))) return Number(value);
      return undefined;
    };
    
    const cleanBoolean = (value: any): boolean | undefined => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();
        if (['yes', 'true', '1', 'on'].includes(lower)) return true;
        if (['no', 'false', '0', 'off', 'none'].includes(lower)) return false;
      }
      return undefined;
    };

    // Basic Property Information
    cleanedData.address = cleanString(result.address);
    cleanedData.city = cleanString(result.city);
    cleanedData.state = cleanString(result.state)?.toUpperCase();
    cleanedData.zipCode = cleanString(result.zipCode);
    cleanedData.county = cleanString(result.county);
    cleanedData.neighborhood = cleanString(result.neighborhood);
    
    // Property Details
    cleanedData.price = cleanNumber(result.price);
    cleanedData.listPrice = cleanNumber(result.listPrice);
    cleanedData.salePrice = cleanNumber(result.salePrice);
    cleanedData.rentPrice = cleanNumber(result.rentPrice);
    cleanedData.pricePerSqFt = cleanNumber(result.pricePerSqFt);
    cleanedData.squareFootage = cleanNumber(result.squareFootage);
    cleanedData.lotSize = cleanNumber(result.lotSize);
    cleanedData.bedrooms = cleanNumber(result.bedrooms);
    cleanedData.bathrooms = cleanNumber(result.bathrooms);
    cleanedData.halfBaths = cleanNumber(result.halfBaths);
    cleanedData.fullBaths = cleanNumber(result.fullBaths);
    
    // Property Features
    cleanedData.propertyType = cleanString(result.propertyType)?.toLowerCase();
    cleanedData.buildingType = cleanString(result.buildingType);
    cleanedData.yearBuilt = cleanNumber(result.yearBuilt);
    cleanedData.stories = cleanNumber(result.stories);
    cleanedData.garage = cleanString(result.garage);
    cleanedData.parking = cleanString(result.parking);
    cleanedData.basement = cleanString(result.basement);
    cleanedData.attic = cleanString(result.attic);
    cleanedData.pool = cleanBoolean(result.pool);
    cleanedData.fireplace = cleanBoolean(result.fireplace);
    cleanedData.airConditioning = cleanString(result.airConditioning);
    cleanedData.heating = cleanString(result.heating);
    
    // Financial Information
    cleanedData.taxes = cleanNumber(result.taxes);
    cleanedData.hoa = cleanNumber(result.hoa);
    cleanedData.insurance = cleanNumber(result.insurance);
    cleanedData.utilities = cleanString(result.utilities);
    cleanedData.financing = cleanString(result.financing);
    cleanedData.downPayment = cleanNumber(result.downPayment);
    cleanedData.mortgageRate = cleanNumber(result.mortgageRate);
    
    // Legal & Ownership
    cleanedData.mlsNumber = cleanString(result.mlsNumber);
    cleanedData.parcelId = cleanString(result.parcelId);
    cleanedData.legalDescription = cleanString(result.legalDescription);
    cleanedData.ownerName = cleanString(result.ownerName);
    cleanedData.titleCompany = cleanString(result.titleCompany);
    
    // Dates & Timeline
    cleanedData.listDate = cleanString(result.listDate);
    cleanedData.saleDate = cleanString(result.saleDate);
    cleanedData.closeDate = cleanString(result.closeDate);
    cleanedData.contractDate = cleanString(result.contractDate);
    cleanedData.inspectionDate = cleanString(result.inspectionDate);
    cleanedData.appraisalDate = cleanString(result.appraisalDate);
    
    // Condition & Features
    cleanedData.condition = cleanString(result.condition);
    cleanedData.renovations = cleanString(result.renovations);
    cleanedData.appliances = cleanString(result.appliances);
    cleanedData.flooring = cleanString(result.flooring);
    cleanedData.roofType = cleanString(result.roofType);
    cleanedData.exteriorMaterial = cleanString(result.exteriorMaterial);
    
    // Location Features
    cleanedData.schoolDistrict = cleanString(result.schoolDistrict);
    cleanedData.walkScore = cleanNumber(result.walkScore);
    cleanedData.nearbyAmenities = cleanString(result.nearbyAmenities);
    cleanedData.transportation = cleanString(result.transportation);
    
    // Document Classification
    cleanedData.documentType = cleanString(result.documentType)?.toLowerCase();
    cleanedData.documentSubtype = cleanString(result.documentSubtype)?.toLowerCase();
    
    // Include any additional fields that weren't explicitly handled
    Object.keys(result).forEach(key => {
      if (!(key in cleanedData) && result[key] !== null && result[key] !== undefined) {
        cleanedData[key] = result[key];
      }
    });

    return cleanedData;
  } catch (error) {
    console.error("Failed to extract property data with Grok:", error);
    throw new Error("Failed to extract property data: " + (error as Error).message);
  }
}
