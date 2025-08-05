# Overview

This is a full-stack real estate document parser application that allows users to upload PDF documents and automatically extract property information using AI. The application features a React frontend with shadcn/ui components and an Express backend with Drizzle ORM for data management. Users can upload real estate documents (listings, contracts, appraisals), which are processed to extract structured property data such as addresses, prices, square footage, and property details.

**GitHub Project Status**: ✅ Successfully pushed to GitHub! The repository is now live with complete professional setup including documentation, CI/CD workflows, issue templates, and deployment guides. Ready for open source collaboration and production deployment.

# Recent Changes

**January 2025**
- ✅ Successfully pushed complete codebase to GitHub repository
- ✅ Fixed file upload functionality by removing conflicting Content-Type headers from FormData requests
- ✅ Resolved View button modal display issues with comprehensive document details
- ✅ Created complete GitHub repository structure with README, LICENSE, CONTRIBUTING guidelines
- ✅ Added CI/CD workflow for automated testing and building
- ✅ Implemented issue templates for bug reports and feature requests
- ✅ Created deployment documentation for multiple platforms
- ✅ Updated gitignore with comprehensive file exclusions for clean repository
- ✅ Configured GitHub authentication with personal access tokens for Replit environment
- ✅ **MAJOR ENHANCEMENT**: Expanded Grok AI extraction to capture ALL possible property information from any real estate document type (not just listings)
- ✅ Enhanced UI to display comprehensive property data in organized sections with color-coded categories
- ✅ Increased extraction scope to include: financial details, legal information, dates/timeline, features/amenities, condition, location data, and document classification
- ✅ **SIMPLIFIED PROCESSING**: Removed complex PDF-to-vision approach, using optimized text extraction + enhanced Grok text analysis for maximum compatibility and reliability
- ✅ **REALESTATECORE INTEGRATION**: Implemented Phase 1 of REC ontology support with JSON-LD generation, semantic classification, and standardized data structure transformation
- ✅ **ENHANCED ERROR HANDLING**: Fixed token limit issues for large documents with ultra-aggressive text truncation (150k character limit optimized for Grok's 131k token maximum)

# User Preferences

Preferred communication style: Simple, everyday language.
Data Architecture Preference: Interested in using RealEstateCore ontology instead of traditional database schema for enhanced standardization and interoperability.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript in SPA mode
- **Routing**: Wouter for lightweight client-side routing
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Build Tool**: Vite with custom configuration for monorepo structure

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Development Setup**: tsx for TypeScript execution in development
- **File Upload**: Multer middleware for handling PDF uploads with 10MB limit
- **PDF Processing**: Custom text extraction service for parsing PDF content
- **API Design**: RESTful endpoints with JSON responses and structured error handling
- **Production Build**: esbuild for bundling server code

## Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: Configured for PostgreSQL via Neon serverless driver
- **Schema Design**: 
  - Documents table for file metadata and processing status
  - Property data table for extracted real estate information
  - Foreign key relationships between documents and extracted data
- **Migrations**: Drizzle Kit for schema management

## AI Integration
- **Provider**: X.AI (Grok) API for natural language processing
- **Purpose**: Extracts structured property data from unstructured PDF text
- **Data Extraction**: Parses addresses, prices, property types, and document types
- **Fallback**: Raw extracted data stored in JSONB for manual review

## File Processing Pipeline
1. PDF upload via drag-and-drop interface
2. Temporary file storage with multer
3. Text extraction from PDF using custom parser
4. AI-powered data extraction via Grok API
5. Structured data storage in PostgreSQL
6. Automatic cleanup of temporary files

## Development Features
- **Hot Reload**: Vite dev server with HMR
- **Type Safety**: Shared TypeScript types between frontend and backend
- **Path Aliases**: Configured for clean imports (@/, @shared/)
- **Error Handling**: Runtime error overlay for development
- **Logging**: Custom request/response logging middleware

# External Dependencies

## Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection via Neon's serverless driver
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-kit**: Database schema management and migrations

## AI Services
- **X.AI Grok API**: Natural language processing for property data extraction

## Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Headless UI primitives for accessible components
- **react-hook-form**: Form handling with validation
- **wouter**: Lightweight routing library
- **date-fns**: Date manipulation utilities

## Backend Services
- **multer**: File upload middleware
- **express**: Web framework
- **tsx**: TypeScript execution for development

## Build Tools
- **vite**: Frontend build tool and dev server
- **esbuild**: Fast bundling for production builds
- **tailwindcss**: Utility-first CSS framework
- **typescript**: Type checking and compilation

## Development Tools
- **@replit/vite-plugin-runtime-error-modal**: Error overlay for Replit environment
- **@replit/vite-plugin-cartographer**: Development tooling for Replit