import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

const heroSlides = [
  {
    id: "machined-parts",
    title: "PRECISION MACHINED PARTS",
    subtitle: "Aerospace-grade components with micron-level accuracy",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    buttonText: "Explore Machined Parts",
    buttonLink: "/machined-parts"
  },
  {
    id: "metalwork",
    title: "BESPOKE METALWORK",
    subtitle: "Handcrafted architectural and decorative pieces",
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    buttonText: "View Metalwork Gallery",
    buttonLink: "/metalwork"
  },
  {
    id: "3d-prints",
    title: "PREMIUM 3D PRINTS",
    subtitle: "High-quality prototyping and production services",
    image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    buttonText: "Get 3D Print Quote",
    buttonLink: "/3d-prints"
  }
]

export function HeroSection() {
  return (
    <section className="relative h-screen overflow-hidden">
      <Carousel className="w-full h-full">
        <CarouselContent className="h-full">
          {heroSlides.map((slide) => (
            <CarouselItem key={slide.id} className="h-full">
              <div className="relative h-screen flex items-center justify-center">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40" />
                </div>

                {/* Content */}
                <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
                  <h1 className="text-5xl md:text-7xl font-bold mb-4 text-balance tracking-tight">
                    {slide.title}
                  </h1>
                  <p className="text-lg md:text-xl mb-8 text-balance max-w-2xl mx-auto font-medium">
                    {slide.subtitle}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button
                      size="lg"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 text-base font-medium rounded-full"
                      asChild
                    >
                      <a href={slide.buttonLink}>{slide.buttonText}</a>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white text-white hover:bg-white hover:text-black px-6 py-3 text-base font-medium rounded-full bg-transparent"
                      asChild
                    >
                      <a href="/contact">Custom Quote</a>
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <CarouselPrevious className="left-4 bg-black/50 hover:bg-black/70 text-white border-white/20" />
        <CarouselNext className="right-4 bg-black/50 hover:bg-black/70 text-white border-white/20" />
      </Carousel>
    </section>
  )
}
