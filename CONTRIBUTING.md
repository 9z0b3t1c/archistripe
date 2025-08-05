# Contributing to Real Estate Document Parser

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see README.md)
4. Start development server: `npm run dev`

## Code Style

- Use TypeScript for all new code
- Follow existing code formatting (Prettier/ESLint)
- Use descriptive variable and function names
- Add comments for complex logic

## Project Structure

```
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Route components
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilities
├── server/          # Express backend
│   ├── services/    # Business logic
│   └── routes.ts    # API endpoints
├── shared/          # Shared types
└── uploads/         # Temporary files
```

## Making Changes

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Test thoroughly
4. Commit with clear messages
5. Push and create a pull request

## Testing

- Test file uploads with various PDF formats
- Verify AI extraction works correctly
- Check responsive design on different screen sizes
- Test error handling scenarios

## Pull Request Guidelines

- Describe what your PR does and why
- Include screenshots for UI changes
- Reference any related issues
- Ensure all checks pass

## Questions?

Open an issue or discussion if you need help or have questions about contributing.