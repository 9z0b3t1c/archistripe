import { type Document, type InsertDocument, type PropertyData, type InsertPropertyData, type DocumentWithData, type Property, type InsertProperty, type PropertyWithDocuments } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Property operations
  createProperty(property: InsertProperty): Promise<Property>;
  getProperty(id: string): Promise<Property | undefined>;
  getAllProperties(): Promise<Property[]>;
  getPropertiesWithDocuments(): Promise<PropertyWithDocuments[]>;
  updateProperty(id: string, updates: Partial<Property>): Promise<void>;
  deleteProperty(id: string): Promise<void>;
  
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  getDocumentsByPropertyId(propertyId: string): Promise<Document[]>;
  updateDocumentStatus(id: string, status: string, errorMessage?: string): Promise<void>;
  deleteDocument(id: string): Promise<void>;
  
  // Property data operations
  createPropertyData(propertyData: InsertPropertyData): Promise<PropertyData>;
  getPropertyDataByDocumentId(documentId: string): Promise<PropertyData | undefined>;
  getAllPropertyData(): Promise<PropertyData[]>;
  getDocumentsWithData(): Promise<DocumentWithData[]>;
}

export class MemStorage implements IStorage {
  private properties: Map<string, Property>;
  private documents: Map<string, Document>;
  private propertyData: Map<string, PropertyData>;

  constructor() {
    this.properties = new Map();
    this.documents = new Map();
    this.propertyData = new Map();
  }

  // Property operations
  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = randomUUID();
    const property: Property = {
      id,
      name: insertProperty.name,
      address: insertProperty.address || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.properties.set(id, property);
    return property;
  }

  async getProperty(id: string): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async getAllProperties(): Promise<Property[]> {
    return Array.from(this.properties.values()).sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async getPropertiesWithDocuments(): Promise<PropertyWithDocuments[]> {
    const properties = await this.getAllProperties();
    return properties.map(property => ({
      ...property,
      documents: Array.from(this.documents.values())
        .filter(doc => doc.propertyId === property.id)
        .map(doc => ({
          ...doc,
          propertyData: Array.from(this.propertyData.values()).find(
            data => data.documentId === doc.id
          ),
        }))
        .sort((a, b) => (b.uploadedAt?.getTime() || 0) - (a.uploadedAt?.getTime() || 0)),
    }));
  }

  async updateProperty(id: string, updates: Partial<Property>): Promise<void> {
    const property = this.properties.get(id);
    if (property) {
      Object.assign(property, { ...updates, updatedAt: new Date() });
      this.properties.set(id, property);
    }
  }

  async deleteProperty(id: string): Promise<void> {
    this.properties.delete(id);
    // Delete associated documents and property data
    const documentsToDelete = Array.from(this.documents.values()).filter(doc => doc.propertyId === id);
    for (const doc of documentsToDelete) {
      await this.deleteDocument(doc.id);
    }
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      id,
      propertyId: insertDocument.propertyId || null,
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

  async getDocumentsByPropertyId(propertyId: string): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.propertyId === propertyId)
      .sort((a, b) => (b.uploadedAt?.getTime() || 0) - (a.uploadedAt?.getTime() || 0));
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
      recData: insertPropertyData.recData || null,
      fullGrokResponse: insertPropertyData.fullGrokResponse || null,
      grokModelUsed: insertPropertyData.grokModelUsed || null,
      grokTokensUsed: insertPropertyData.grokTokensUsed || null,
      grokProcessingTime: insertPropertyData.grokProcessingTime || null,
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
