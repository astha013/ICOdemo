import { forwardRef } from "react";

const Footer = forwardRef<HTMLElement>((_, ref) => (
  <footer className="border-t border-border py-12" ref={ref}>
    <div className="container mx-auto px-4 text-center">
      <p className="font-display text-lg font-bold gradient-text mb-2">ICO Token</p>
      <p className="text-muted-foreground text-sm">© 2026 ICO Token. All rights reserved.</p>
      <div className="flex justify-center gap-6 mt-4">
        <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Docs</a>
        <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Twitter</a>
        <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Discord</a>
        <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Telegram</a>
      </div>
    </div>
  </footer>
));

Footer.displayName = "Footer";

export default Footer;
