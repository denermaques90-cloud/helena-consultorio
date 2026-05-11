import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Instagram, MessageCircle, MapPin } from "lucide-react";

export function SiteFooter() {
  const [cfg, setCfg] = useState<{ whatsapp_contato?: string | null; instagram?: string | null }>({});
  useEffect(() => {
    supabase.from("config").select("whatsapp_contato, instagram").limit(1).maybeSingle()
      .then(({ data }) => data && setCfg(data));
  }, []);
  const wa = cfg.whatsapp_contato || "5511999999999";
  const ig = cfg.instagram || "helenamartins.psi";
  return (
    <footer id="contato" className="border-t border-border bg-background mt-24">
      <div className="mx-auto max-w-6xl px-5 py-14 grid gap-10 md:grid-cols-3">
        <div>
          <h3 className="font-serif text-xl text-foreground">Dra. Helena Martins</h3>
          <p className="mt-1 text-sm text-muted-foreground">Psicóloga Clínica</p>
          <p className="text-xs text-primary font-bold tracking-wider mt-1">CRP 06/123456</p>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin size={14} className="text-primary" /> Guarulhos — SP
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold mb-3">Contato</p>
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
            <MessageCircle size={16} /> WhatsApp
          </a>
          <a href={`https://instagram.com/${ig}`} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
            <Instagram size={16} /> @{ig}
          </a>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold mb-3">Atendimento</p>
          <p className="text-sm text-muted-foreground">Adultos · Presencial e Online</p>
          <p className="text-sm text-muted-foreground mt-1">Segunda a Sábado</p>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-[10px] text-muted-foreground flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
        <span>© {new Date().getFullYear()} Dra. Helena Martins · Todos os direitos reservados</span>
        <span className="hidden md:inline text-border">|</span>
        <a href="/entrada" className="hover:text-primary transition-colors font-medium">Acesso Profissional</a>
      </div>
    </footer>
  );
}
