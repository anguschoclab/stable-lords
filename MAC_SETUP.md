# Stable Lords - Mac Setup Guide

This guide will help you set up and run Stable Lords on a Mac.

## Prerequisites

### 1. Install Homebrew (if not already installed)

Homebrew is the package manager for macOS. Open Terminal and run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Node.js

**Option A: Using nvm (Recommended)**

nvm (Node Version Manager) allows you to manage multiple Node.js versions:

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload your shell configuration
source ~/.zshrc

# Install the latest LTS version of Node.js
nvm install --lts

# Use the installed version
nvm use --lts
```

**Option B: Using Homebrew**

```bash
brew install node
```

### 3. Verify Installation

```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
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

**Using npm:**
```bash
npm install
```

**Using Bun (Faster):**
```bash
# Install Bun first
curl -fsSL https://bun.sh/install | bash

# Then install dependencies
bun install
```

### 4. Run the Development Server

**Using npm:**
```bash
npm run dev
```

**Using Bun:**
```bash
bun run dev
```

The development server will start at `http://localhost:5173`. Open this URL in your browser to play the game.

## Building for Production

```bash
npm run build
```

The production build will be created in the `dist` directory.

## Running Tests

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Linting and Formatting

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Common Mac-Specific Issues

### Issue: "Command not found: node"

**Solution:** Make sure Node.js is in your PATH. If using nvm, ensure you've sourced your shell configuration:

```bash
source ~/.zshrc
```

### Issue: Permission Denied Errors

**Solution:** If you encounter permission issues, you may need to fix npm permissions:

```bash
# Create a directory for global packages
mkdir ~/.npm-global

# Configure npm to use the new directory
npm config set prefix '~/.npm-global'

# Add to your PATH (add this to ~/.zshrc)
export PATH=~/.npm-global/bin:$PATH
```

### Issue: Audio Not Playing

**Solution:** macOS requires user interaction before audio can play. Make sure you interact with the page (click somewhere) before audio features will work. The game should prompt you for this.

### Issue: Port 5173 Already in Use

**Solution:** If another process is using port 5173, Vite will automatically use the next available port (5174, 5175, etc.). Check the terminal output for the actual URL.

## Tips for Mac Development

- **Terminal:** Use iTerm2 or the built-in Terminal app for a better command-line experience
- **Editor:** VS Code is recommended and has excellent TypeScript support
- **Browser:** Chrome or Firefox are recommended for development (Safari may have stricter security policies)
- **Performance:** For better performance, consider using Bun instead of npm for package management and running scripts

## Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Node.js Documentation](https://nodejs.org/)

## Troubleshooting

If you encounter issues not covered here:

1. Check the [main README.md](README.md) for general setup information
2. Ensure you're using Node.js v18 or higher
3. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
4. Clear npm cache: `npm cache clean --force`
5. Check that your macOS version is compatible with the Node.js version you're using

## Support

For issues specific to Stable Lords gameplay or features, please refer to the game's in-game help or documentation.
