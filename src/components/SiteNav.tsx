import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#sobre", label: "Sobre" },
    { href: "#especialidades", label: "Especialidades" },
    { href: "#ambiente", label: "Ambiente" },
    { href: "#como-funciona", label: "Como funciona" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all ${
        scrolled ? "bg-background/85 backdrop-blur-md border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex flex-col leading-tight">
          <span className="font-serif text-lg text-foreground">Dra. Helena Martins</span>
          <span className="text-[10px] uppercase tracking-[0.25em] text-gold">Psicologia</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-muted-foreground transition hover:text-gold">
              {l.label}
            </a>
          ))}
          <Link
            to="/agendar"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Agendar consulta
          </Link>
        </nav>
        <button
          className="md:hidden text-foreground"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
          <div className="flex flex-col px-5 py-4 gap-4">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm text-muted-foreground">
                {l.label}
              </a>
            ))}
            <Link
              to="/agendar"
              onClick={() => setOpen(false)}
              className="rounded-md bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground"
            >
              Agendar consulta
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
