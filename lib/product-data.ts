export interface Product {
  id: string
  name: string
  subtitle: string
  price: number
  rating: number
  reviewCount: number
  material: string
  finish?: string
  tolerance?: string
  dimensions: string
  weight: string
  image: string
  description: string
  specifications: Record<string, any>
  applications: string[]
  leadTime: string
  minimumOrder: number
  inStock: boolean
  category: string
}

// Import our product data
import machinedPartsData from '@/products/machined-parts.json'
import metalworkData from '@/products/metalwork.json'
import threeDPrintsData from '@/products/3d-prints.json'
import customOrdersData from '@/products/custom-orders.json'

// Combine all products into a single database
export const productDatabase: Record<string, Product> = {
  // Machined Parts
  "precision-bearing-housing": machinedPartsData.products[0] as Product,
  "titanium-valve-body": machinedPartsData.products[1] as Product,
  "aluminum-mounting-plate": machinedPartsData.products[2] as Product,
  "stainless-steel-shaft": machinedPartsData.products[3] as Product,
  "brass-fitting": machinedPartsData.products[4] as Product,
  
  // Metalwork
  "custom-steel-bracket": metalworkData.products[0] as Product,
  "decorative-metal-panel": metalworkData.products[1] as Product,
  "brass-door-handle": metalworkData.products[2] as Product,
  "stainless-steel-bracket": metalworkData.products[3] as Product,
  "wrought-iron-railing": metalworkData.products[4] as Product,
  
  // 3D Prints
  "prototype-gear-set": threeDPrintsData.products[0] as Product,
  "custom-enclosure": threeDPrintsData.products[1] as Product,
  "sensor-housing": threeDPrintsData.products[2] as Product,
  "functional-prototype": threeDPrintsData.products[3] as Product,
  "production-part": threeDPrintsData.products[4] as Product,
  
  // Custom Orders
  "bespoke-metal-art": customOrdersData.products[0] as Product,
  "precision-prototype": customOrdersData.products[1] as Product,
  "architectural-element": customOrdersData.products[2] as Product,
  "industrial-fixture": customOrdersData.products[3] as Product,
  "artistic-commission": customOrdersData.products[4] as Product
}

export function getProduct(id: string): Product | null {
  return productDatabase[id] || null
}

export function getProductById(id: string): Product | null {
  return getProduct(id)
}

export function getAllProducts(): Product[] {
  return Object.values(productDatabase)
}

export function getProductsByCategory(category: string): Product[] {
  return Object.values(productDatabase).filter((product) => product.category === category)
}

export function getProductsByMaterial(material: string): Product[] {
  return Object.values(productDatabase).filter((product) => 
    product.material.toLowerCase().includes(material.toLowerCase())
  )
}

export function getProductsByApplication(application: string): Product[] {
  return Object.values(productDatabase).filter((product) => 
    product.applications.some(app => 
      app.toLowerCase().includes(application.toLowerCase())
    )
  )
}

export function getProductsByPriceRange(min: number, max: number): Product[] {
  return Object.values(productDatabase).filter((product) => 
    product.price >= min && product.price <= max
  )
}
