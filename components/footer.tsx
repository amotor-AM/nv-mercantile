import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Clock } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold text-primary mb-4">NV MERCANTILE</h3>
            <p className="text-sm text-background/80 mb-4 max-w-md">
              Specializing in high-quality machined parts, bespoke metalwork, and precision 3D prints. 
              We blend traditional craftsmanship with cutting-edge technology to deliver exceptional results.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-background/60 hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-background/60 hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-background/60 hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-background/60 hover:text-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold mb-4">Products</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/machined-parts" className="hover:text-primary transition-colors">
                  Machined Parts
                </Link>
              </li>
              <li>
                <Link href="/metalwork" className="hover:text-primary transition-colors">
                  Metalwork
                </Link>
              </li>
              <li>
                <Link href="/3d-prints" className="hover:text-primary transition-colors">
                  3D Prints
                </Link>
              </li>
              <li>
                <Link href="/custom-orders" className="hover:text-primary transition-colors">
                  Custom Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  CNC Machining
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Custom Fabrication
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Prototyping
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Quality Assurance
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* About & Contact Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 border-t border-background/20 pt-8">
          {/* About */}
          <div>
            <h3 className="font-semibold mb-4">About Us</h3>
            <p className="text-sm text-background/80 mb-4">
              NV Mercantile is a premier manufacturing company dedicated to delivering precision-engineered 
              solutions for industries ranging from aerospace to medical devices. Our team of skilled 
              engineers and craftsmen ensures every project meets the highest standards of quality and accuracy.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>123 Industrial Way, Manufacturing District, NV 89101</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>Mon-Fri: 8AM-6PM | Sat: 9AM-3PM</span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span>+1 (702) 555-0123</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <a href="mailto:info@nvmercantile.com" className="hover:text-primary transition-colors">
                  info@nvmercantile.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Service Area: Nevada, California, Arizona, Utah</span>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium mb-2">Why Choose NV Mercantile?</h4>
              <ul className="text-xs text-background/80 space-y-1">
                <li>• Aerospace-grade precision and tolerances</li>
                <li>• 20+ years of manufacturing experience</li>
                <li>• ISO 9001:2015 certified</li>
                <li>• Rapid prototyping and production</li>
                <li>• Custom solutions for unique requirements</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-background/20 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Resources */}
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Technical Specifications
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Material Guide
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Quality Standards
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    CAD File Requirements
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Technical Support
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Order Status
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Shipping Information
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Returns & Warranty
                  </Link>
                </li>
              </ul>
            </div>

            {/* Industries */}
            <div>
              <h3 className="font-semibold mb-4">Industries Served</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Aerospace
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Medical Devices
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Automotive
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Robotics
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-background/20">
            <p className="text-sm mb-4 md:mb-0">© 2025 NV Mercantile, Inc. All Rights Reserved</p>
            <div className="flex items-center gap-4 text-sm">
              <Link href="#" className="hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                Cookie Policy
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
