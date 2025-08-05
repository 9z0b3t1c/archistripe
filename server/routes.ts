import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDocumentSchema, insertPropertyDataSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { extractPropertyDataFromPDF } from "./services/grok";
import { extractTextFromPDF, deleteTempFile } from "./services/pdf-parser";
import { transformToREC, validateRECData } from "./services/rec-transformer";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        filename: string;
        originalname: string;
        size: number;
        mimetype: string;
        path: string;
      }
    }
  }
}

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all documents
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getDocumentsWithData();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Upload and process PDF
  app.post("/api/documents/upload", upload.single("file"), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Create document record
      const document = await storage.createDocument({
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        status: "processing",
      });

      res.json(document);

      // Process the document asynchronously
      processDocumentAsync(document.id, req.file.path);

    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // Get property data
  app.get("/api/property-data", async (req, res) => {
    try {
      const propertyData = await storage.getAllPropertyData();
      res.json(propertyData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch property data" });
    }
  });

  // Get analytics
  app.get("/api/analytics", async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      const propertyData = await storage.getAllPropertyData();

      const totalDocuments = documents.length;
      const processedDocuments = documents.filter(d => d.status === "completed").length;
      const failedDocuments = documents.filter(d => d.status === "failed").length;

      const totalProperties = propertyData.length;
      const avgPrice = propertyData
        .filter(p => p.price)
        .reduce((sum, p) => sum + parseFloat(p.price!), 0) / propertyData.filter(p => p.price).length || 0;
      
      const avgSquareFootage = propertyData
        .filter(p => p.squareFootage)
        .reduce((sum, p) => sum + p.squareFootage!, 0) / propertyData.filter(p => p.squareFootage).length || 0;
      
      const avgBedrooms = propertyData
        .filter(p => p.bedrooms)
        .reduce((sum, p) => sum + p.bedrooms!, 0) / propertyData.filter(p => p.bedrooms).length || 0;

      const propertyTypes = propertyData.reduce((acc, p) => {
        if (p.propertyType) {
          acc[p.propertyType] = (acc[p.propertyType] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      res.json({
        totalDocuments,
        processedDocuments,
        failedDocuments,
        totalProperties,
        avgPrice,
        avgSquareFootage,
        avgBedrooms,
        propertyTypes,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Delete a document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Delete the file from filesystem
      const filePath = path.join(__dirname, '..', 'uploads', document.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete from storage
      await storage.deleteDocument(id);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  });

  // Download a document
  app.get("/api/documents/:id/download", async (req, res) => {
    try {
      const { id } = req.params;
      
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      const filePath = path.join(__dirname, "..", "uploads", document.filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found on disk" });
      }

      res.setHeader("Content-Disposition", `attachment; filename="${document.originalName}"`);
      res.setHeader("Content-Type", document.mimeType);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ error: "Failed to download document" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Process document asynchronously
async function processDocumentAsync(documentId: string, filePath: string) {
  try {
    console.log(`Starting to process document ${documentId} with enhanced Grok analysis + RealEstateCore integration`);
    
    // Update status to processing
    await storage.updateDocumentStatus(documentId, "processing");

    // Extract text from PDF first
    const extractedText = await extractTextFromPDF(filePath);
    console.log(`Extracted text length: ${extractedText.length} characters`);
    
    // Get original filename from storage
    const document = await storage.getDocument(documentId);
    const originalFileName = document?.originalName || 'unknown.pdf';

    // Extract comprehensive property data using enhanced Grok prompts
    const propertyData = await extractPropertyDataFromPDF(extractedText, originalFileName);
    console.log(`Extracted property data:`, propertyData);

    // Transform to RealEstateCore JSON-LD structure
    const recData = transformToREC(propertyData, documentId, originalFileName);
    console.log(`REC JSON-LD structure:`, JSON.stringify(recData, null, 2));

    // Validate REC data structure
    const isValidREC = validateRECData(recData);
    console.log(`REC validation result: ${isValidREC}`);

    // Save extracted property data with all new comprehensive fields
    await storage.createPropertyData({
      documentId,
      address: propertyData.address || null,
      city: propertyData.city || null,
      state: propertyData.state || null,
      zipCode: propertyData.zipCode || null,
      price: propertyData.price ? propertyData.price.toString() : null,
      squareFootage: propertyData.squareFootage || null,
      bedrooms: propertyData.bedrooms || null,
      bathrooms: propertyData.bathrooms ? propertyData.bathrooms.toString() : null,
      propertyType: propertyData.propertyType || null,
      documentType: propertyData.documentType || null,
      rawExtractedData: { 
        processingMethod: 'enhanced-grok-text-analysis', 
        fileName: originalFileName,
        extractedText: extractedText.substring(0, 500) + '...',
        ...propertyData 
      },
      recData: recData, // RealEstateCore JSON-LD structure
    });

    // Update document status to completed
    await storage.updateDocumentStatus(documentId, "completed");

    // Clean up temp file
    await deleteTempFile(filePath);
    
    console.log(`Successfully processed document ${documentId} using enhanced Grok analysis with RealEstateCore semantic modeling`);

  } catch (error) {
    console.error("Processing error:", error);
    await storage.updateDocumentStatus(
      documentId, 
      "failed", 
      (error as Error).message
    );
    
    // Clean up temp file
    await deleteTempFile(filePath);
  }
}