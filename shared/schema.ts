import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Properties table for grouping documents
export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // User-provided property name
  address: text("address"), // Primary address from first document
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").references(() => properties.id), // Link to property
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  size: integer("size").notNull(),
  mimeType: text("mime_type").notNull().default("application/pdf"),
  status: text("status").notNull().default("uploaded"), // uploaded, processing, completed, failed
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  errorMessage: text("error_message"),
});

export const propertyData = pgTable("property_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").references(() => documents.id).notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  price: decimal("price"),
  squareFootage: integer("square_footage"),
  bedrooms: integer("bedrooms"),
  bathrooms: decimal("bathrooms"),
  propertyType: text("property_type"), // house, condo, apartment, etc.
  documentType: text("document_type"), // listing, contract, appraisal, etc.
  rawExtractedData: jsonb("raw_extracted_data"),
  recData: jsonb("rec_data"), // RealEstateCore JSON-LD structure
  
  // Full Grok AI response storage
  fullGrokResponse: jsonb("full_grok_response"),
  grokModelUsed: text("grok_model_used"),
  grokTokensUsed: integer("grok_tokens_used"),
  grokProcessingTime: integer("grok_processing_time_ms"),
  
  extractedAt: timestamp("extracted_at").defaultNow(),
});

// Relations
export const propertiesRelations = relations(properties, ({ many }) => ({
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  property: one(properties, {
    fields: [documents.propertyId],
    references: [properties.id],
  }),
  propertyData: one(propertyData, {
    fields: [documents.id],
    references: [propertyData.documentId],
  }),
}));

export const propertyDataRelations = relations(propertyData, ({ one }) => ({
  document: one(documents, {
    fields: [propertyData.documentId],
    references: [documents.id],
  }),
}));

// Schemas
export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
  processedAt: true,
});

export const insertPropertyDataSchema = createInsertSchema(propertyData).omit({
  id: true,
  extractedAt: true,
});

// Types
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertPropertyData = z.infer<typeof insertPropertyDataSchema>;
export type PropertyData = typeof propertyData.$inferSelect;

export type DocumentWithData = Document & {
  propertyData?: PropertyData;
};

export type PropertyWithDocuments = Property & {
  documents: DocumentWithData[];
};
