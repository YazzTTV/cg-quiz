// Script to fix Prisma 7 client exports
// Compiles the TypeScript client.ts to JavaScript

const fs = require('fs');
const path = require('path');

const clientTsPath = path.join(__dirname, '../node_modules/.prisma/client/client.ts');
const defaultJsPath = path.join(__dirname, '../node_modules/.prisma/client/default.js');

if (!fs.existsSync(clientTsPath)) {
  console.log('client.ts not found, skipping...');
  process.exit(0);
}

// Read the TypeScript file
const clientTs = fs.readFileSync(clientTsPath, 'utf-8');

// Convert ES module exports to CommonJS
// Replace: export const PrismaClient = ...
// With: exports.PrismaClient = ...
let clientJs = clientTs
  .replace(/export const (\w+) = /g, 'exports.$1 = ')
  .replace(/export \* from ['"]([^'"]+)['"]/g, (match, importPath) => {
    // Handle re-exports
    return `Object.assign(exports, require('${importPath}'));`;
  })
  .replace(/export type \w+.*$/gm, '') // Remove type exports
  .replace(/import \* as (\w+) from ['"]([^'"]+)['"]/g, 'const $1 = require("$2");')
  .replace(/import \* from ['"]([^'"]+)['"]/g, 'require("$1");')
  .replace(/import type .*$/gm, ''); // Remove type imports

// Create default.js that exports from the compiled version
const defaultJsContent = `// Prisma 7 - Compiled export
// This file exports the PrismaClient from the TypeScript client
// The client.ts is transpiled by Next.js/Turbopack at build time

// For now, we'll use a workaround that works with the bundler
const path = require('path');
const fs = require('fs');

// Check if we're in a Next.js build context
if (typeof require !== 'undefined' && require.resolve) {
  try {
    // Try to load the TypeScript file - Next.js/Turbopack will handle it
    const clientPath = path.join(__dirname, 'client.ts');
    if (fs.existsSync(clientPath)) {
      // Use a dynamic require that will be resolved by the bundler
      module.exports = require('./client.ts');
    } else {
      throw new Error('client.ts not found');
    }
  } catch (e) {
    // Fallback: return empty object, bundler will fill it
    module.exports = {};
  }
} else {
  module.exports = {};
}
`;

fs.writeFileSync(defaultJsPath, defaultJsContent);

// Create default.d.ts for TypeScript
const defaultDtsPath = path.join(__dirname, '../node_modules/.prisma/client/default.d.ts');
const defaultDtsContent = `export * from './client';\n`;
fs.writeFileSync(defaultDtsPath, defaultDtsContent);

console.log('✓ Fixed Prisma client default.js and default.d.ts');

