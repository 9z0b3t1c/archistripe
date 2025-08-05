import * as fs from "fs";
import * as path from "path";

// Dynamic import for pdf-parse to avoid ES module conflicts
async function getPdfParse() {
  try {
    const pdfParse = await import("pdf-parse");
    return pdfParse.default;
  } catch (error) {
    console.log("PDF-parse not available, using fallback method");
    return null;
  }
}

// Advanced PDF text extraction with fallback parsing
export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const buffer = await fs.promises.readFile(filePath);
    
    console.log(`Attempting to extract text from PDF: ${path.basename(filePath)}`);
    
    // Try pdf-parse first for proper PDF parsing
    const pdfParse = await getPdfParse();
    if (pdfParse) {
      try {
        const pdfData = await pdfParse(buffer);
        let extractedText = pdfData.text.trim();
        
        console.log(`PDF-parse extracted ${extractedText.length} characters from ${pdfData.numpages || 'unknown'} pages`);
        
        // Also log metadata for debugging
        if (pdfData.info) {
          console.log(`PDF Info: Title="${pdfData.info.Title || 'N/A'}", Creator="${pdfData.info.Creator || 'N/A'}"`);
        }
        
        if (extractedText.length > 20) {
          return extractedText;
        }
        
        console.log("PDF-parse extracted minimal text, trying fallback method...");
      } catch (pdfParseError: any) {
        console.log("PDF-parse failed, trying fallback method:", pdfParseError?.message || "Unknown error");
      }
    }
    
    // Fallback: Basic PDF text extraction using regex patterns
    const pdfText = buffer.toString('binary');
    
    // Look for text between text operators in PDF
    const textRegex = /\(([^)]+)\)|<([^>]+)>/g;
    const extractedTexts: string[] = [];
    let match;
    
    while ((match = textRegex.exec(pdfText)) !== null) {
      const text = match[1] || match[2];
      if (text && text.length > 1 && /[a-zA-Z]/.test(text)) {
        extractedTexts.push(text);
      }
    }
    
    // Join extracted text and clean it up
    let extractedText = extractedTexts.join(' ');
    
    // Clean up the text
    extractedText = extractedText
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    console.log(`Fallback method extracted ${extractedText.length} characters`);
    
    if (extractedText.length < 20) {
      // For scanned PDFs or images, provide helpful message
      return `Document appears to be a scanned PDF or image-based document (${path.basename(filePath)}). 
      Text extraction yielded minimal content. This may be a property listing image, floor plan, 
      or scanned document that would require OCR processing for full text extraction.
      
      Limited extracted content: ${extractedText}`;
    }
    
    return extractedText;
  } catch (error) {
    console.error("Failed to extract text from PDF:", error);
    throw new Error("Failed to extract text from PDF: " + (error as Error).message);
  }
}

export async function deleteTempFile(filePath: string): Promise<void> {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    console.error("Failed to delete temp file:", error);
  }
}
