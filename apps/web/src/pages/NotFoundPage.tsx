import { Link } from "react-router-dom";
import { m } from "motion/react";
import { ParticleBackground } from "../components/ParticleBackground";
import { GlitchText } from "../components/TextReveal";
import { Button } from "../components/Button";

export function NotFoundPage() {
  return (
    <div className="relative py-24 flex items-center justify-center overflow-hidden">
      <ParticleBackground className="absolute inset-0 z-0 opacity-50" />
      <div className="absolute inset-0 bg-noise opacity-20 z-0 pointer-events-none" />
      
      <div className="relative z-10 text-center px-4">
        <m.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-8xl md:text-9xl font-display font-bold text-gradient-brand mb-4"
        >
          404
        </m.h1>
        
        <div className="mb-8 text-2xl md:text-3xl font-display font-bold text-text-primary">
          <GlitchText text="Page not found" />
        </div>
        
        <m.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-text-muted mb-8 max-w-md mx-auto"
        >
          Looks like this level hasn't been unlocked yet. The page you're looking for doesn't exist or has been moved.
        </m.p>
        
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link to="/">
            <Button variant="primary" size="lg" glow>
              Browse Games
            </Button>
          </Link>
        </m.div>
      </div>
    </div>
  );
}
