'use client';

import Link from 'next/link';
import { Button } from '@/design-system/primitives/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Search, Home, Gamepad2, ArrowLeft, Compass } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function NotFound(): React.ReactElement {
  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-dark">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-glow/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-neon/5 rounded-full blur-3xl" />
        </div>

        <Card className="relative w-full max-w-md glass border border-border-subtle shadow-lg animate-fade-in">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-glow/50 to-transparent" />
          
          <CardHeader className="text-center space-y-4">
            {/* 404 Display */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-neon/20 rounded-full blur-2xl" />
                <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-bg-secondary/50 border border-border-subtle">
                  <span className="text-4xl font-bold text-text-primary">
                    404
                  </span>
                </div>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-text-primary">
                Page Not Found
              </CardTitle>
              <p className="text-sm text-text-muted leading-relaxed">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
            {/* Helpful Suggestions */}
            <div className="p-3 rounded-lg bg-bg-secondary/30 border border-border-subtle">
              <div className="flex items-center gap-2 mb-2">
                <Compass className="w-4 h-4 text-cyan-glow" />
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Try These Instead
                </span>
              </div>
              <div className="space-y-1">
                <Link 
                  href="/catalog" 
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-secondary/50 transition-all duration-200 group"
                >
                  <Gamepad2 className="w-4 h-4 text-purple-neon" />
                  <span className="text-sm">Browse game keys & software</span>
                  <ArrowLeft className="w-3 h-3 ml-auto rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <Link 
                  href="/" 
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-secondary/50 transition-all duration-200 group"
                >
                  <Home className="w-4 h-4 text-cyan-glow" />
                  <span className="text-sm">Return to homepage</span>
                  <ArrowLeft className="w-3 h-3 ml-auto rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            {/* Primary Action */}
            <Button 
              asChild
              variant="outline"
              className="w-full h-11 gap-2 border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10 hover:border-cyan-glow/60 hover:text-cyan-300 font-medium transition-all duration-200"
            >
              <Link href="/catalog">
                <Search className="w-4 h-4" />
                Browse Catalog
              </Link>
            </Button>

            {/* Secondary Action */}
            <Button 
              variant="ghost" 
              asChild
              className="w-full h-10 gap-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary/50 transition-all duration-200"
            >
              <Link href="/">
                <Home className="w-4 h-4" />
                Back to Home
              </Link>
            </Button>
          </CardFooter>

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-neon/30 to-transparent" />
        </Card>
      </main>

      <Footer />
    </div>
  );
}
