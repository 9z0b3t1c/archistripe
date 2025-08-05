# Real Estate Document Parser

A full-stack application that processes real estate PDFs using AI to extract and store structured property information.

## Features

- **PDF Upload**: Drag-and-drop interface for uploading real estate documents
- **AI Processing**: Uses Grok AI to extract structured property data from PDFs
- **Real-time Updates**: Live status tracking during document processing
- **Document Management**: View, analyze, and download processed documents
- **Property Data Extraction**: Automatically extracts addresses, prices, square footage, bedrooms, bathrooms, and more

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** components for modern UI
- **TanStack Query** for state management
- **Wouter** for routing

### Backend
- **Express.js** with TypeScript
- **Multer** for file uploads
- **Custom PDF parser** for text extraction
- **Grok AI (X.AI)** for natural language processing

### Database
- **PostgreSQL** with Neon serverless driver
- **Drizzle ORM** for type-safe database operations
- **Drizzle Kit** for migrations

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- X.AI API key for Grok

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd real-estate-document-parser
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env file with:
XAI_API_KEY=your_xai_api_key_here
DATABASE_URL=your_postgresql_connection_string
```

4. Run database migrations:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Usage

1. **Upload Documents**: Drag and drop real estate PDF files onto the upload area
2. **Processing**: Watch real-time status updates as documents are processed
3. **View Results**: Click "View" to see extracted property data in a detailed modal
4. **Download**: Access original PDF files through the download feature

## Extracted Data Fields

- Property address and location (city, state, ZIP)
- Property price
- Square footage
- Number of bedrooms and bathrooms
- Property type (house, condo, apartment, etc.)
- Document type (listing, contract, appraisal, etc.)

## Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Drizzle Studio

### Architecture

The application uses a monorepo structure:

- `client/` - React frontend
- `server/` - Express backend
- `shared/` - Shared TypeScript types
- `uploads/` - Temporary file storage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open a GitHub issue.