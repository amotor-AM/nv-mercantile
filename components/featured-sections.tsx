import { Button } from "@/components/ui/button"
import Link from "next/link"

const featuredProducts = [
  {
    id: "precision-bearing-housing",
    name: "Precision Bearing Housing",
    category: "Machined Parts",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    price: "$245",
    link: "/machined-parts"
  },
  {
    id: "custom-steel-bracket",
    name: "Custom Steel Bracket",
    category: "Metalwork",
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    price: "$180",
    link: "/metalwork"
  },
  {
    id: "prototype-gear-set",
    name: "Prototype Gear Set",
    category: "3D Prints",
    image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    price: "$95",
    link: "/3d-prints"
  },
  {
    id: "titanium-valve-body",
    name: "Titanium Valve Body",
    category: "Machined Parts",
    image: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    price: "$420",
    link: "/machined-parts"
  },
  {
    id: "decorative-metal-panel",
    name: "Decorative Metal Panel",
    category: "Metalwork",
    image: "https://images.unsplash.com/photo-1572635196184-84e35138cf62?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    price: "$320",
    link: "/metalwork"
  }
]

export function FeaturedSections() {
  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Two main featured sections */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Precision Bearing Housing */}
          <div className="relative overflow-hidden group cursor-pointer">
            <Link href={featuredProducts[0].link}>
              <div className="aspect-[16/10] relative">
                <img
                  src={featuredProducts[0].image}
                  alt={featuredProducts[0].name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-8 left-8 text-white">
                  <p className="text-sm font-medium mb-2">{featuredProducts[0].category}</p>
                  <h3 className="text-4xl font-bold mb-4">{featuredProducts[0].name}</h3>
                  <p className="text-lg font-semibold mb-4">{featuredProducts[0].price}</p>
                  <Button className="bg-white text-black hover:bg-gray-100 rounded-full px-6 py-2 text-sm font-medium">
                    View Details
                  </Button>
                </div>
              </div>
            </Link>
          </div>

          {/* Custom Steel Bracket */}
          <div className="relative overflow-hidden group cursor-pointer">
            <Link href={featuredProducts[1].link}>
              <div className="aspect-[16/10] relative">
                <img
                  src={featuredProducts[1].image}
                  alt={featuredProducts[1].name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-8 left-8 text-white">
                  <p className="text-sm font-medium mb-2">{featuredProducts[1].category}</p>
                  <h3 className="text-4xl font-bold mb-4">{featuredProducts[1].name}</h3>
                  <p className="text-lg font-semibold mb-4">{featuredProducts[1].price}</p>
                  <Button className="bg-white text-black hover:bg-gray-100 rounded-full px-6 py-2 text-sm font-medium">
                    View Details
                  </Button>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Three featured products */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative overflow-hidden group cursor-pointer">
            <Link href={featuredProducts[2].link}>
              <div className="aspect-[4/5] relative">
                <img
                  src={featuredProducts[2].image}
                  alt={featuredProducts[2].name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <p className="text-sm font-medium mb-2">{featuredProducts[2].category}</p>
                  <p className="text-lg font-semibold mb-2">{featuredProducts[2].price}</p>
                  <Button className="bg-white text-black hover:bg-gray-100 rounded-full px-6 py-2 text-sm font-medium">
                    View Details
                  </Button>
                </div>
              </div>
            </Link>
          </div>

          <div className="relative overflow-hidden group cursor-pointer">
            <Link href={featuredProducts[3].link}>
              <div className="aspect-[4/5] relative">
                <img
                  src={featuredProducts[3].image}
                  alt={featuredProducts[3].name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <p className="text-sm font-medium mb-2">{featuredProducts[3].category}</p>
                  <p className="text-lg font-semibold mb-2">{featuredProducts[3].price}</p>
                  <Button className="bg-white text-black hover:bg-gray-100 rounded-full px-6 py-2 text-sm font-medium">
                    View Details
                  </Button>
                </div>
              </div>
            </Link>
          </div>

          <div className="relative overflow-hidden group cursor-pointer">
            <Link href={featuredProducts[4].link}>
              <div className="aspect-[4/5] relative">
                <img
                  src={featuredProducts[4].image}
                  alt={featuredProducts[4].name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <p className="text-sm font-medium mb-2">{featuredProducts[4].category}</p>
                  <p className="text-lg font-semibold mb-2">{featuredProducts[4].price}</p>
                  <Button className="bg-white text-black hover:bg-gray-100 rounded-full px-6 py-2 text-sm font-medium">
                    View Details
                  </Button>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
