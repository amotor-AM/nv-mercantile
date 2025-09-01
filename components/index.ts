// Main component exports following Atomic Design principles

// Atoms - Basic building blocks
export * from "./atoms"

// Molecules - Simple combinations of atoms
export * from "./molecules"

// Organisms - Complex components made of molecules and atoms
export * from "./organisms"

// Templates - Page-level layouts combining organisms
export * from "./templates"

// Legacy components (to be migrated)
export { CartIcon } from "./cart-icon"
export { Footer } from "./footer"
export { ThemeProvider } from "./theme-provider"
