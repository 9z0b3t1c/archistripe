import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  extractedAt: timestamp("extracted_at").defaultNow(),
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

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertPropertyData = z.infer<typeof insertPropertyDataSchema>;
export type PropertyData = typeof propertyData.$inferSelect;

export type DocumentWithData = Document & {
  propertyData?: PropertyData;
};
