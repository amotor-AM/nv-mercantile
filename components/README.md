# Component Architecture - Atomic Design

This codebase follows the **Atomic Design** methodology, organizing components into a hierarchical structure for better maintainability, reusability, and scalability.

## Structure Overview

### 🧱 Atoms (`/atoms`)
Basic building blocks that cannot be broken down further. These are typically simple UI elements.

**Examples:**
- `Button`, `Input`, `Label` - Basic form elements
- `Badge`, `Avatar` - Simple display components
- `Progress`, `Separator` - Utility components

### 🧬 Molecules (`/molecules`)
Simple combinations of atoms that form more complex UI elements. These are reusable combinations that serve a single purpose.

**Examples:**
- `SearchBar` - Combines Input + Button + Search icon
- `NavigationLink` - Styled Link component
- `ProductBadge` - Status badges for products
- `ProductCard` - Individual product display component

### 🦠 Organisms (`/organisms`)
Complex components made of molecules and atoms. These are larger, more complete sections of the interface.

**Examples:**
- `Header` - Navigation header with search and cart
- `ProductGrid` - Product listing with filters and sorting
- `HeroSection` - Hero carousel section

### 📄 Templates (`/templates`)
Page-level layouts that combine organisms into complete page structures. These provide the skeleton for pages.

**Examples:**
- `PageTemplate` - Basic page layout with header/footer
- `ProductCategoryTemplate` - Product category pages with grid

### 📱 Pages (`/app`)
Specific page implementations that use templates and populate them with real content. These remain in the Next.js app directory.

## Benefits of This Structure

1. **Reusability** - Components can be easily reused across the application
2. **Maintainability** - Clear hierarchy makes it easy to find and modify components
3. **Scalability** - Easy to add new components at the appropriate level
4. **Consistency** - Standardized component patterns
5. **Testing** - Easier to test individual components in isolation

## Usage Guidelines

### Creating New Components

1. **Start with Atoms** - Check if you can build your component from existing atoms
2. **Create Molecules** - If you need a simple combination of atoms
3. **Build Organisms** - For complex UI sections
4. **Use Templates** - For page layouts

### Import Pattern

```tsx
// Import from specific levels
import { Button, Input } from "@/components/atoms"
import { SearchBar, ProductCard } from "@/components/molecules"
import { Header, ProductGrid } from "@/components/organisms"
import { PageTemplate } from "@/components/templates"

// Or import everything from main index
import { Button, SearchBar, Header, PageTemplate } from "@/components"
```

### Component Props

- **Atoms**: Keep props minimal and focused on styling/behavior
- **Molecules**: Add specific functionality props
- **Organisms**: Include complex state management and business logic
- **Templates**: Focus on layout props and content slots

## Migration Status

✅ **Completed:**
- Atomic design directory structure
- Basic atoms from shadcn/ui
- Core molecules (SearchBar, NavigationLink, ProductBadge, ProductCard)
- Key organisms (Header, ProductGrid, HeroSection)
- Template components (PageTemplate, ProductCategoryTemplate)
- Updated main pages to use new structure

🔄 **In Progress:**
- Migrating remaining legacy components
- Updating all page imports
- Testing integration

## Best Practices

1. **Single Responsibility** - Each component should have one clear purpose
2. **Composition over Inheritance** - Build complex components by composing simpler ones
3. **Prop Drilling Prevention** - Use context or state management for shared state
4. **Consistent Naming** - Use descriptive, consistent naming conventions
5. **Type Safety** - Always type component props and state

## Future Enhancements

- [ ] Add Storybook for component documentation
- [ ] Create more specialized templates
- [ ] Add component testing suite
- [ ] Implement design tokens system
- [ ] Add accessibility audit for all components
