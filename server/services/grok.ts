import OpenAI from "openai";

const openai = new OpenAI({ 
  baseURL: "https://api.x.ai/v1", 
  apiKey: process.env.XAI_API_KEY || process.env.GROK_API_KEY || "your-api-key-here"
});

interface ExtractedPropertyData {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  price?: number;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  documentType?: string;
  [key: string]: any;
}

export async function extractPropertyData(text: string): Promise<ExtractedPropertyData> {
  try {
    const prompt = `
You are an expert real estate document parser. Analyze the following text from a real estate PDF document and extract structured property information.

Please extract the following fields if available:
- address: Full property address
- city: City name
- state: State (use 2-letter abbreviation)
- zipCode: ZIP/postal code
- price: Property price (number only, no currency symbols)
- squareFootage: Square footage (number only)
- bedrooms: Number of bedrooms (integer)
- bathrooms: Number of bathrooms (can be decimal like 2.5)
- propertyType: Type of property (house, condo, apartment, townhouse, etc.)
- documentType: Type of document (listing, contract, appraisal, inspection, etc.)

Return only valid JSON with the extracted data. If a field cannot be determined, omit it from the response.

Text to analyze:
${text}
`;

    const response = await openai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: "You are a real estate document analysis expert. Extract property information from documents and return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Clean and validate the extracted data
    const cleanedData: ExtractedPropertyData = {};
    
    if (result.address && typeof result.address === 'string') {
      cleanedData.address = result.address.trim();
    }
    if (result.city && typeof result.city === 'string') {
      cleanedData.city = result.city.trim();
    }
    if (result.state && typeof result.state === 'string') {
      cleanedData.state = result.state.trim().toUpperCase();
    }
    if (result.zipCode) {
      cleanedData.zipCode = String(result.zipCode).trim();
    }
    if (result.price && !isNaN(Number(result.price))) {
      cleanedData.price = Number(result.price);
    }
    if (result.squareFootage && !isNaN(Number(result.squareFootage))) {
      cleanedData.squareFootage = Number(result.squareFootage);
    }
    if (result.bedrooms && !isNaN(Number(result.bedrooms))) {
      cleanedData.bedrooms = Math.floor(Number(result.bedrooms));
    }
    if (result.bathrooms && !isNaN(Number(result.bathrooms))) {
      cleanedData.bathrooms = Number(result.bathrooms);
    }
    if (result.propertyType && typeof result.propertyType === 'string') {
      cleanedData.propertyType = result.propertyType.toLowerCase().trim();
    }
    if (result.documentType && typeof result.documentType === 'string') {
      cleanedData.documentType = result.documentType.toLowerCase().trim();
    }

    return cleanedData;
  } catch (error) {
    console.error("Failed to extract property data with Grok:", error);
    throw new Error("Failed to extract property data: " + (error as Error).message);
  }
}
