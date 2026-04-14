# Stable Lords - Mac Setup Guide

This guide will help you set up and run Stable Lords on a Mac.

## Prerequisites

### 1. Install Bun

Bun is the package manager and runtime used by this project.

```bash
curl -fsSL https://bun.sh/install | bash
```

Then reload your shell:

```bash
source ~/.zshrc
```

Verify the installation:

```bash
bun --version
```

## Getting Started

### 1. Clone the Repository

```bash
# If you have SSH access
git clone git@github.com:your-username/stable-lords.git

# Or if using HTTPS
git clone https://github.com/your-username/stable-lords.git
```

### 2. Navigate to the Project Directory

```bash
cd stable-lords
```

### 3. Install Dependencies

```bash
bun install
```

### 4. Run the Development Server

```bash
bun run dev
```

The development server will start at `http://localhost:5173`. Open this URL in your browser to play the game.

## Building for Production

```bash
bun run build
```

The production build will be created in the `dist` directory.

## Running Tests

```bash
# Run tests once
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

## Linting and Formatting

```bash
# Run linter
bun run lint

# Fix linting issues
bun run lint:fix

# Format code
bun run format
```

## Common Mac-Specific Issues

### Issue: "Command not found: bun"

**Solution:** Make sure Bun is in your PATH. After installing, reload your shell:

```bash
source ~/.zshrc
```

### Issue: Audio Not Playing

**Solution:** macOS requires user interaction before audio can play. Make sure you interact with the page (click somewhere) before audio features will work. The game should prompt you for this.

### Issue: Port 5173 Already in Use

**Solution:** If another process is using port 5173, Vite will automatically use the next available port (5174, 5175, etc.). Check the terminal output for the actual URL.

## Tips for Mac Development

- **Terminal:** Use iTerm2 or the built-in Terminal app for a better command-line experience
- **Editor:** VS Code is recommended and has excellent TypeScript support
- **Browser:** Chrome or Firefox are recommended for development (Safari may have stricter security policies)

## Additional Resources

- [Bun Documentation](https://bun.sh/docs)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## Troubleshooting

If you encounter issues not covered here:

1. Check the [main README.md](README.md) for general setup information
2. Delete `node_modules` and reinstall: `rm -rf node_modules && bun install`
3. Check that your macOS version is up to date

## Support

For issues specific to Stable Lords gameplay or features, please refer to the game's in-game help or documentation.
