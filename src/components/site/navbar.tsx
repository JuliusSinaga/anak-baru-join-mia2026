"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { MenuIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { LogoMark } from "@/components/site/logo"
import { NAV_LINKS, SITE } from "@/lib/site"
import { cn } from "@/lib/utils"

function isCurrent(pathname: string, href: string) {
  if (href.includes("#")) return false
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
}

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <div className="mx-auto flex min-h-15 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold whitespace-nowrap text-navy">
          <LogoMark className="size-7" />
          <span>{SITE.name}</span>
          <span className="sr-only">, beranda</span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden sm:block">
          <ul className="flex gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-lg px-3 font-semibold whitespace-nowrap text-navy-soft hover:bg-accent",
                    "aria-[current=page]:bg-accent aria-[current=page]:text-primary",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon-lg" className="size-11 sm:hidden" aria-label="Buka menu navigasi">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription className="sr-only">Navigasi utama JejakDana</SheetDescription>
            </SheetHeader>
            <nav aria-label="Navigasi utama (mobile)" className="px-4">
              <ul className="grid gap-1">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
                      className="flex min-h-11 items-center rounded-lg px-3 font-semibold text-navy-soft hover:bg-accent aria-[current=page]:bg-accent aria-[current=page]:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
