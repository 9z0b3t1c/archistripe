import { type Document, type InsertDocument, type PropertyData, type InsertPropertyData, type DocumentWithData } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  updateDocumentStatus(id: string, status: string, errorMessage?: string): Promise<void>;
  deleteDocument(id: string): Promise<void>;
  
  // Property data operations
  createPropertyData(propertyData: InsertPropertyData): Promise<PropertyData>;
  getPropertyDataByDocumentId(documentId: string): Promise<PropertyData | undefined>;
  getAllPropertyData(): Promise<PropertyData[]>;
  getDocumentsWithData(): Promise<DocumentWithData[]>;
}

export class MemStorage implements IStorage {
  private documents: Map<string, Document>;
  private propertyData: Map<string, PropertyData>;

  constructor() {
    this.documents = new Map();
    this.propertyData = new Map();
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      id,
      filename: insertDocument.filename,
      originalName: insertDocument.originalName,
      size: insertDocument.size,
      mimeType: insertDocument.mimeType || "application/pdf",
      status: insertDocument.status || "uploaded",
      uploadedAt: new Date(),
      processedAt: null,
      errorMessage: insertDocument.errorMessage || null,
    };
    this.documents.set(id, document);
    return document;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values()).sort(
      (a, b) => (b.uploadedAt?.getTime() || 0) - (a.uploadedAt?.getTime() || 0)
    );
  }

  async updateDocumentStatus(id: string, status: string, errorMessage?: string): Promise<void> {
    const document = this.documents.get(id);
    if (document) {
      document.status = status;
      document.errorMessage = errorMessage || null;
      if (status === "completed") {
        document.processedAt = new Date();
      }
      this.documents.set(id, document);
    }
  }

  async deleteDocument(id: string): Promise<void> {
    this.documents.delete(id);
    // Also delete associated property data
    const propertyDataArray = Array.from(this.propertyData.values());
    const associatedData = propertyDataArray.find(data => data.documentId === id);
    if (associatedData) {
      this.propertyData.delete(associatedData.id);
    }
  }

  async createPropertyData(insertPropertyData: InsertPropertyData): Promise<PropertyData> {
    const id = randomUUID();
    const data: PropertyData = {
      id,
      documentId: insertPropertyData.documentId,
      address: insertPropertyData.address || null,
      city: insertPropertyData.city || null,
      state: insertPropertyData.state || null,
      zipCode: insertPropertyData.zipCode || null,
      price: insertPropertyData.price || null,
      squareFootage: insertPropertyData.squareFootage || null,
      bedrooms: insertPropertyData.bedrooms || null,
      bathrooms: insertPropertyData.bathrooms || null,
      propertyType: insertPropertyData.propertyType || null,
      documentType: insertPropertyData.documentType || null,
      rawExtractedData: insertPropertyData.rawExtractedData || null,
      extractedAt: new Date(),
    };
    this.propertyData.set(id, data);
    return data;
  }

  async getPropertyDataByDocumentId(documentId: string): Promise<PropertyData | undefined> {
    return Array.from(this.propertyData.values()).find(
      data => data.documentId === documentId
    );
  }

  async getAllPropertyData(): Promise<PropertyData[]> {
    return Array.from(this.propertyData.values()).sort(
      (a, b) => (b.extractedAt?.getTime() || 0) - (a.extractedAt?.getTime() || 0)
    );
  }

  async getDocumentsWithData(): Promise<DocumentWithData[]> {
    const documents = await this.getAllDocuments();
    return documents.map(doc => ({
      ...doc,
      propertyData: Array.from(this.propertyData.values()).find(
        data => data.documentId === doc.id
      ),
    }));
  }
}

export const storage = new MemStorage();
