import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDocumentSchema, insertPropertyDataSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import { extractTextFromPDF, deleteTempFile } from "./services/pdf-parser";
import { extractPropertyData } from "./services/grok";

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
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      // Create document record
      const documentData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        status: "uploaded",
      };

      const document = await storage.createDocument(documentData);

      // Start processing in background
      processDocumentAsync(document.id, req.file.path);

      res.json(document);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Get document by ID
  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const propertyData = await storage.getPropertyDataByDocumentId(document.id);
      res.json({ ...document, propertyData });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      await storage.deleteDocument(req.params.id);
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Get all extracted property data
  app.get("/api/property-data", async (req, res) => {
    try {
      const propertyData = await storage.getAllPropertyData();
      res.json(propertyData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch property data" });
    }
  });

  // Get analytics/stats
  app.get("/api/analytics", async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      const propertyData = await storage.getAllPropertyData();

      const stats = {
        totalDocuments: documents.length,
        processedDocuments: documents.filter(d => d.status === "completed").length,
        failedDocuments: documents.filter(d => d.status === "failed").length,
        totalProperties: propertyData.length,
        avgPrice: propertyData.length > 0 
          ? propertyData.reduce((sum, p) => sum + (Number(p.price) || 0), 0) / propertyData.length 
          : 0,
        avgSquareFootage: propertyData.length > 0 
          ? propertyData.reduce((sum, p) => sum + (p.squareFootage || 0), 0) / propertyData.length 
          : 0,
        avgBedrooms: propertyData.length > 0 
          ? propertyData.reduce((sum, p) => sum + (p.bedrooms || 0), 0) / propertyData.length 
          : 0,
        propertyTypes: propertyData.reduce((acc, p) => {
          const type = p.propertyType || "unknown";
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Background processing function
async function processDocumentAsync(documentId: string, filePath: string) {
  try {
    // Update status to processing
    await storage.updateDocumentStatus(documentId, "processing");

    // Extract text from PDF
    const extractedText = await extractTextFromPDF(filePath);

    // Use Grok AI to extract structured data
    const propertyData = await extractPropertyData(extractedText);

    // Save extracted property data
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
      rawExtractedData: { extractedText, ...propertyData },
    });

    // Update document status to completed
    await storage.updateDocumentStatus(documentId, "completed");

    // Clean up temp file
    await deleteTempFile(filePath);

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
