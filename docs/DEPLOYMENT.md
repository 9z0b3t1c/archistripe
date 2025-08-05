# Deployment Guide

This guide covers deploying the Real Estate Document Parser application to various platforms.

## Environment Variables

Before deploying, ensure you have these environment variables configured:

```bash
XAI_API_KEY=your_xai_api_key_here
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=production
```

## Replit Deployment

The application is pre-configured for Replit deployment:

1. Fork or import the repository to Replit
2. Add your environment variables in the Secrets tab
3. Run the application with `npm run dev`
4. Use Replit's deployment feature for production hosting

## Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables in Vercel dashboard
5. Deploy

## Railway Deployment

1. Connect your GitHub repository to Railway
2. Add environment variables in Railway dashboard  
3. Railway will automatically detect and deploy the Node.js application

## Docker Deployment

Create a `Dockerfile` in the project root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t real-estate-parser .
docker run -p 5000:5000 --env-file .env real-estate-parser
```

## Database Setup

For production deployments, ensure your PostgreSQL database is set up:

1. Create a PostgreSQL database
2. Run migrations: `npm run db:push`
3. Update DATABASE_URL in your environment

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database connected and migrated
- [ ] File upload directory permissions set
- [ ] SSL/HTTPS enabled
- [ ] Error monitoring configured
- [ ] Backup strategy implemented

## Troubleshooting

### Common Issues

**File Upload Fails**: Check upload directory permissions and available disk space

**AI Processing Errors**: Verify XAI_API_KEY is valid and has sufficient credits

**Database Connection**: Ensure DATABASE_URL format is correct and database is accessible

**Build Errors**: Run `npm run check` locally to catch TypeScript errors before deployment