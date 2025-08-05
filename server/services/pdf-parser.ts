import * as fs from "fs";
import * as path from "path";

// Simple PDF text extraction using basic parsing
export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const buffer = await fs.promises.readFile(filePath);
    
    // Basic PDF text extraction
    // Convert buffer to string and try to extract readable text
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
    
    if (extractedText.length < 50) {
      throw new Error("Insufficient text content extracted from PDF");
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
