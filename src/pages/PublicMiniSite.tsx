import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MiniSiteData } from '@/hooks/useMiniSite';
import { useIsMobile } from '@/hooks/use-mobile';
import ScrollAnimation from '@/components/ScrollAnimation';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Star, 
  ExternalLink,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Twitter
} from 'lucide-react';

interface PublicMiniSiteProps {
  data?: MiniSiteData;
  isPreview?: boolean;
}

const socialIcons = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  x: Twitter,
  tiktok: () => <div className="w-5 h-5 bg-current rounded" />
};

const colorThemes = {
  blue: {
    primary: 'from-blue-600 to-blue-800',
    secondary: 'from-blue-100 to-blue-200',
    accent: 'text-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700',
    lightBg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
    hoverBg: 'hover:bg-blue-50',
    cardBorder: 'border-l-blue-500',
    gradient: 'from-blue-50 via-blue-100 to-blue-50',
    masculineGradient: 'from-blue-900/20 via-blue-600/10 to-blue-800/15',
    masculineCard: 'bg-gradient-to-br from-white/90 via-blue-50/50 to-white/80',
    masculineAccent: 'from-blue-600 to-blue-800',
    masculineShadow: 'shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20'
  },
  green: {
    primary: 'from-green-600 to-green-800',
    secondary: 'from-green-100 to-green-200',
    accent: 'text-green-600',
    button: 'bg-green-600 hover:bg-green-700',
    lightBg: 'bg-green-50',
    border: 'border-green-200',
    iconBg: 'bg-green-100',
    iconText: 'text-green-600',
    hoverBg: 'hover:bg-green-50',
    cardBorder: 'border-l-green-500',
    gradient: 'from-green-50 via-green-100 to-green-50',
    masculineGradient: 'from-green-900/20 via-green-600/10 to-green-800/15',
    masculineCard: 'bg-gradient-to-br from-white/90 via-green-50/50 to-white/80',
    masculineAccent: 'from-green-600 to-green-800',
    masculineShadow: 'shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20'
  },
  purple: {
    primary: 'from-purple-600 to-purple-800',
    secondary: 'from-purple-100 to-purple-200',
    accent: 'text-purple-600',
    button: 'bg-purple-600 hover:bg-purple-700',
    lightBg: 'bg-purple-50',
    border: 'border-purple-200',
    iconBg: 'bg-purple-100',
    iconText: 'text-purple-600',
    hoverBg: 'hover:bg-purple-50',
    cardBorder: 'border-l-purple-500',
    gradient: 'from-purple-50 via-purple-100 to-purple-50',
    masculineGradient: 'from-purple-900/20 via-purple-600/10 to-purple-800/15',
    masculineCard: 'bg-gradient-to-br from-white/90 via-purple-50/50 to-white/80',
    masculineAccent: 'from-purple-600 to-purple-800',
    masculineShadow: 'shadow-lg shadow-purple-500/10 hover:shadow-xl hover:shadow-purple-500/20'
  },
  pink: {
    primary: 'from-pink-600 to-pink-800',
    secondary: 'from-pink-100 to-pink-200',
    accent: 'text-pink-600',
    button: 'bg-pink-600 hover:bg-pink-700',
    lightBg: 'bg-pink-50',
    border: 'border-pink-200',
    iconBg: 'bg-pink-100',
    iconText: 'text-pink-600',
    hoverBg: 'hover:bg-pink-50',
    cardBorder: 'border-l-pink-500',
    gradient: 'from-pink-50 via-pink-100 to-pink-50',
    masculineGradient: 'from-pink-900/20 via-pink-600/10 to-pink-800/15',
    masculineCard: 'bg-gradient-to-br from-white/90 via-pink-50/50 to-white/80',
    masculineAccent: 'from-pink-600 to-pink-800',
    masculineShadow: 'shadow-lg shadow-pink-500/10 hover:shadow-xl hover:shadow-pink-500/20'
  },
  orange: {
    primary: 'from-orange-600 to-orange-800',
    secondary: 'from-orange-100 to-orange-200',
    accent: 'text-orange-600',
    button: 'bg-orange-600 hover:bg-orange-700',
    lightBg: 'bg-orange-50',
    border: 'border-orange-200',
    iconBg: 'bg-orange-100',
    iconText: 'text-orange-600',
    hoverBg: 'hover:bg-orange-50',
    cardBorder: 'border-l-orange-500',
    gradient: 'from-orange-50 via-orange-100 to-orange-50',
    masculineGradient: 'from-orange-900/20 via-orange-600/10 to-orange-800/15',
    masculineCard: 'bg-gradient-to-br from-white/90 via-orange-50/50 to-white/80',
    masculineAccent: 'from-orange-600 to-orange-800',
    masculineShadow: 'shadow-lg shadow-orange-500/10 hover:shadow-xl hover:shadow-orange-500/20'
  },
  teal: {
    primary: 'from-teal-600 to-teal-800',
    secondary: 'from-teal-100 to-teal-200',
    accent: 'text-teal-600',
    button: 'bg-teal-600 hover:bg-teal-700',
    lightBg: 'bg-teal-50',
    border: 'border-teal-200',
    iconBg: 'bg-teal-100',
    iconText: 'text-teal-600',
    hoverBg: 'hover:bg-teal-50',
    cardBorder: 'border-l-teal-500',
    gradient: 'from-teal-50 via-teal-100 to-teal-50',
    masculineGradient: 'from-teal-900/20 via-teal-600/10 to-teal-800/15',
    masculineCard: 'bg-gradient-to-br from-white/90 via-teal-50/50 to-white/80',
    masculineAccent: 'from-teal-600 to-teal-800',
    masculineShadow: 'shadow-lg shadow-teal-500/10 hover:shadow-xl hover:shadow-teal-500/20'
  },
  red: {
    primary: 'from-red-600 to-red-800',
    secondary: 'from-red-100 to-red-200',
    accent: 'text-red-600',
    button: 'bg-red-600 hover:bg-red-700',
    lightBg: 'bg-red-50',
    border: 'border-red-200',
    iconBg: 'bg-red-100',
    iconText: 'text-red-600',
    hoverBg: 'hover:bg-red-50',
    cardBorder: 'border-l-red-500',
    gradient: 'from-red-50 via-red-100 to-red-50',
    masculineGradient: 'from-red-900/20 via-red-600/10 to-red-800/15',
    masculineCard: 'bg-gradient-to-br from-white/90 via-red-50/50 to-white/80',
    masculineAccent: 'from-red-600 to-red-800',
    masculineShadow: 'shadow-lg shadow-red-500/10 hover:shadow-xl hover:shadow-red-500/20'
  },
  indigo: {
    primary: 'from-indigo-600 to-indigo-800',
    secondary: 'from-indigo-100 to-indigo-200',
    accent: 'text-indigo-600',
    button: 'bg-indigo-600 hover:bg-indigo-700',
    lightBg: 'bg-indigo-50',
    border: 'border-indigo-200',
    iconBg: 'bg-indigo-100',
    iconText: 'text-indigo-600',
    hoverBg: 'hover:bg-indigo-50',
    cardBorder: 'border-l-indigo-500',
    gradient: 'from-indigo-50 via-indigo-100 to-indigo-50',
    masculineGradient: 'from-indigo-900/20 via-indigo-600/10 to-indigo-800/15',
    masculineCard: 'bg-gradient-to-br from-white/90 via-indigo-50/50 to-white/80',
    masculineAccent: 'from-indigo-600 to-indigo-800',
    masculineShadow: 'shadow-lg shadow-indigo-500/10 hover:shadow-xl hover:shadow-indigo-500/20'
  },
  yellow: {
    primary: 'from-yellow-600 to-yellow-800',
    secondary: 'from-yellow-100 to-yellow-200',
    accent: 'text-yellow-600',
    button: 'bg-yellow-600 hover:bg-yellow-700',
    lightBg: 'bg-yellow-50',
    border: 'border-yellow-200',
    iconBg: 'bg-yellow-100',
    iconText: 'text-yellow-600',
    hoverBg: 'hover:bg-yellow-50',
    cardBorder: 'border-l-yellow-500',
    gradient: 'from-yellow-50 via-yellow-100 to-yellow-50',
    masculineGradient: 'from-yellow-900/20 via-yellow-600/10 to-yellow-800/15',
    masculineCard: 'bg-gradient-to-br from-white/90 via-yellow-50/50 to-white/80',
    masculineAccent: 'from-yellow-600 to-yellow-800',
    masculineShadow: 'shadow-lg shadow-yellow-500/10 hover:shadow-xl hover:shadow-yellow-500/20'
  },
  gray: {
    primary: 'from-gray-600 to-gray-800',
    secondary: 'from-gray-100 to-gray-200',
    accent: 'text-gray-600',
    button: 'bg-gray-600 hover:bg-gray-700',
    lightBg: 'bg-gray-50',
    border: 'border-gray-200',
    iconBg: 'bg-gray-100',
    iconText: 'text-gray-600',
    hoverBg: 'hover:bg-gray-50',
    cardBorder: 'border-l-gray-500',
    gradient: 'from-gray-50 via-gray-100 to-gray-50',
    masculineGradient: 'from-gray-900/20 via-gray-600/10 to-gray-800/15',
    masculineCard: 'bg-gradient-to-br from-white/90 via-gray-50/50 to-white/80',
    masculineAccent: 'from-gray-600 to-gray-800',
    masculineShadow: 'shadow-lg shadow-gray-500/10 hover:shadow-xl hover:shadow-gray-500/20'
  },
  emerald: {
    primary: 'from-emerald-600 to-emerald-800',
    secondary: 'from-emerald-100 to-emerald-200',
    accent: 'text-emerald-600',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    lightBg: 'bg-emerald-50',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
    hoverBg: 'hover:bg-emerald-50',
    cardBorder: 'border-l-emerald-500',
    gradient: 'from-emerald-50 via-emerald-100 to-emerald-50',
    masculineGradient: 'from-emerald-900/20 via-emerald-600/10 to-emerald-800/15',
    masculineCard: 'bg-gradient-to-br from-white/90 via-emerald-50/50 to-white/80',
    masculineAccent: 'from-emerald-600 to-emerald-800',
    masculineShadow: 'shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:shadow-emerald-500/20'
  },
  cyan: {
    primary: 'from-cyan-600 to-cyan-800',
    secondary: 'from-cyan-100 to-cyan-200',
    accent: 'text-cyan-600',
    button: 'bg-cyan-600 hover:bg-cyan-700',
    lightBg: 'bg-cyan-50',
    border: 'border-cyan-200',
    iconBg: 'bg-cyan-100',
    iconText: 'text-cyan-600',
    hoverBg: 'hover:bg-cyan-50',
    cardBorder: 'border-l-cyan-500',
    gradient: 'from-cyan-50 via-cyan-100 to-cyan-50',
    masculineGradient: 'from-cyan-900/20 via-cyan-600/10 to-cyan-800/15',
    masculineCard: 'bg-gradient-to-br from-white/90 via-cyan-50/50 to-white/80',
    masculineAccent: 'from-cyan-600 to-cyan-800',
    masculineShadow: 'shadow-lg shadow-cyan-500/10 hover:shadow-xl hover:shadow-cyan-500/20'
  },
  amber: {
    primary: 'from-amber-600 to-amber-800',
    secondary: 'from-amber-100 to-amber-200',
    accent: 'text-amber-600',
    button: 'bg-amber-600 hover:bg-amber-700',
    lightBg: 'bg-amber-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
    hoverBg: 'hover:bg-amber-50',
    cardBorder: 'border-l-amber-500',
    gradient: 'from-amber-50 via-amber-100 to-amber-50',
    masculineGradient: 'from-amber-900/20 via-amber-600/10 to-amber-800/15',
    masculineCard: 'bg-gradient-to-br from-white/90 via-amber-50/50 to-white/80',
    masculineAccent: 'from-amber-600 to-amber-800',
    masculineShadow: 'shadow-lg shadow-amber-500/10 hover:shadow-xl hover:shadow-amber-500/20'
  },
  lime: {
    primary: 'from-lime-600 to-lime-800',
    secondary: 'from-lime-100 to-lime-200',
    accent: 'text-lime-600',
    button: 'bg-lime-600 hover:bg-lime-700',
    lightBg: 'bg-lime-50',
    border: 'border-lime-200',
    iconBg: 'bg-lime-100',
    iconText: 'text-lime-600',
    hoverBg: 'hover:bg-lime-50',
    cardBorder: 'border-l-lime-500',
    gradient: 'from-lime-50 via-lime-100 to-lime-50',
    masculineGradient: 'from-lime-900/20 via-lime-600/10 to-lime-800/15',
    masculineCard: 'bg-gradient-to-br from-white/90 via-lime-50/50 to-white/80',
    masculineAccent: 'from-lime-600 to-lime-800',
    masculineShadow: 'shadow-lg shadow-lime-500/10 hover:shadow-xl hover:shadow-lime-500/20'
  },
  slate: {
    primary: 'from-slate-600 to-slate-800',
    secondary: 'from-slate-100 to-slate-200',
    accent: 'text-slate-600',
    button: 'bg-slate-600 hover:bg-slate-700',
    lightBg: 'bg-slate-50',
    border: 'border-slate-200',
    iconBg: 'bg-slate-100',
    iconText: 'text-slate-600',
    hoverBg: 'hover:bg-slate-50',
    cardBorder: 'border-l-slate-500',
    gradient: 'from-slate-50 via-slate-100 to-slate-50',
    masculineGradient: 'from-slate-900/20 via-slate-600/10 to-slate-800/15',
    masculineCard: 'bg-gradient-to-br from-white/90 via-slate-50/50 to-white/80',
    masculineAccent: 'from-slate-600 to-slate-800',
    masculineShadow: 'shadow-lg shadow-slate-500/10 hover:shadow-xl hover:shadow-slate-500/20'
  }
};

const designStyles = {
  feminine: {
    containerClass: 'bg-gradient-to-br from-rose-100 via-pink-100 to-purple-100 relative overflow-hidden',
    headerStyle: 'rounded-b-3xl shadow-2xl relative overflow-hidden border-b-4 border-gradient-to-r from-pink-400 to-purple-400',
    cardStyle: 'rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-pink-200/50 bg-gradient-to-br from-white/80 to-pink-50/50 backdrop-blur-sm hover:scale-[1.02] hover:-translate-y-1',
    titleFont: 'font-serif text-4xl md:text-6xl bg-gradient-to-r from-pink-600 via-purple-600 to-rose-600 bg-clip-text text-transparent',
    subtitleFont: 'font-light italic text-xl text-pink-700/80',
    sectionTitleFont: 'font-serif text-3xl text-pink-800 relative inline-block after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-1 after:bg-gradient-to-r after:from-pink-400 after:to-purple-400 after:rounded-full',
    buttonStyle: 'rounded-full px-10 py-4 font-medium transition-all duration-300 hover:scale-110 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl hover:shadow-pink-500/25 transform hover:-translate-y-1',
    decorativeElement: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floral pattern background */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <pattern id="floral" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="2" fill="currentColor" className="text-pink-400" />
                <path d="M10 5 Q15 10 10 15 Q5 10 10 5" fill="currentColor" className="text-rose-400" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#floral)" />
          </svg>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-10 right-10 w-8 h-8 bg-gradient-to-br from-pink-300 to-purple-300 rounded-full opacity-60 animate-bounce" style={{animationDelay: '0s', animationDuration: '3s'}} />
        <div className="absolute top-32 right-32 w-6 h-6 bg-gradient-to-br from-rose-300 to-pink-300 rounded-full opacity-50 animate-bounce" style={{animationDelay: '1s', animationDuration: '4s'}} />
        <div className="absolute top-20 right-48 w-4 h-4 bg-gradient-to-br from-purple-300 to-rose-300 rounded-full opacity-40 animate-bounce" style={{animationDelay: '2s', animationDuration: '5s'}} />
        
        {/* Decorative border elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-pink-200/20 to-transparent rounded-full transform -translate-x-16 -translate-y-16" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-purple-200/20 to-transparent rounded-full transform translate-x-20 translate-y-20" />
      </div>
    )
  },
  masculine: {
    containerClass: 'bg-gradient-to-br from-slate-900/5 via-slate-600/10 to-slate-800/8 relative overflow-hidden',
    headerStyle: 'shadow-2xl relative overflow-hidden bg-gradient-to-r from-slate-800/20 to-slate-600/15 backdrop-blur-sm',
    cardStyle: 'rounded-lg shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-200/50 hover:border-slate-300/70 backdrop-blur-sm hover:scale-[1.02] hover:-translate-y-1 transform-gpu',
    titleFont: 'font-bold text-4xl md:text-6xl tracking-tight bg-gradient-to-r from-slate-800 via-slate-600 to-slate-700 bg-clip-text text-transparent',
    subtitleFont: 'font-medium text-xl text-slate-700',
    sectionTitleFont: 'font-bold text-3xl tracking-wide bg-gradient-to-r from-slate-700 to-slate-600 bg-clip-text text-transparent relative inline-block after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-1 after:bg-gradient-to-r after:from-slate-500 after:to-slate-600 after:rounded-full',
    buttonStyle: 'px-8 py-4 font-bold uppercase tracking-wide transition-all duration-300 hover:scale-110 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white shadow-lg hover:shadow-xl hover:shadow-slate-500/25 transform hover:-translate-y-1 rounded-lg',
    decorativeElement: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Geometric pattern background */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <pattern id="geometric" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="5" height="5" fill="currentColor" className="text-slate-600" />
                <rect x="5" y="5" width="5" height="5" fill="currentColor" className="text-slate-700" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#geometric)" />
          </svg>
        </div>
        
        {/* Angular elements */}
        <div className="absolute top-0 right-0 w-0 h-0 border-l-[200px] border-b-[200px] border-l-transparent border-b-slate-600/5" />
        <div className="absolute bottom-0 left-0 w-0 h-0 border-r-[150px] border-t-[150px] border-r-transparent border-t-slate-700/5" />
        
        {/* Subtle gradient overlays */}
        <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-slate-600/10 to-transparent rounded-full transform -translate-x-20 -translate-y-20" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-slate-700/10 to-transparent rounded-full transform translate-x-24 translate-y-24" />
      </div>
    )
  },
  neutral: {
    containerClass: 'bg-gradient-to-br from-gray-50 via-white to-slate-50',
    headerStyle: 'shadow-lg',
    cardStyle: 'rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-gray-400',
    titleFont: 'font-semibold text-4xl md:text-5xl',
    subtitleFont: 'font-normal text-xl',
    sectionTitleFont: 'font-semibold text-2xl',
    buttonStyle: 'rounded-md px-6 py-3 font-medium transition-all hover:scale-105',
    decorativeElement: null
  }
};

export const PublicMiniSite: React.FC<PublicMiniSiteProps> = ({ 
  data: propData, 
  isPreview = false 
}) => {
  // LOGS TRÈS BASIQUES POUR DEBUG MOBILE
  console.log('🚀 [MOBILE_DEBUG] Component PublicMiniSite démarré');
  console.log('🚀 [MOBILE_DEBUG] Navigator info:', {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine
  });
  
  const { slug } = useParams();
  console.log('🚀 [MOBILE_DEBUG] Slug récupéré:', slug);
  const normalizedSlug = (slug || '').replace(/\./g, '-');
  
  const [siteData, setSiteData] = useState<MiniSiteData | null>(propData || null);
  const [loading, setLoading] = useState(!propData);
  const [reviews, setReviews] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [retryCount, setRetryCount] = useState(0);
  
  console.log('🚀 [MOBILE_DEBUG] État initial défini');
  
  // Test hook mobile avec try/catch
  let mobilehookData;
  try {
    mobilehookData = useIsMobile();
    console.log('🚀 [MOBILE_DEBUG] Hook mobile OK:', mobilehookData);
  } catch (error) {
    console.error('❌ [MOBILE_DEBUG] Erreur hook mobile:', error);
    mobilehookData = { isMobileDevice: false, isMobileViewport: false, connectionInfo: { online: true } };
  }
  
  const { isMobileDevice, isMobileViewport, connectionInfo } = mobilehookData;

  // Redirection immédiate si le slug contient des points
  useEffect(() => {
    if (slug && slug.includes('.')) {
      const newUrl = window.location.pathname.replace(slug, normalizedSlug) + window.location.search + window.location.hash;
      window.location.replace(newUrl);
    }
  }, [slug, normalizedSlug]);

  useEffect(() => {
    console.log('🚀 [MOBILE_DEBUG] Premier useEffect exécuté');
    console.log('🚀 [MOBILE_DEBUG] Conditions:', { propData: !!propData, slug, isPreview });
    
    if (!propData && slug) {
      console.log('🚀 [MOBILE_DEBUG] Appel fetchSiteData');
      fetchSiteData();
    } else if (propData && isPreview) {
      console.log('🚀 [MOBILE_DEBUG] Mode preview détecté');
      // En mode preview, récupérer les avis depuis les données de session
      const storedPreviewData = sessionStorage.getItem('miniSitePreview');
      if (storedPreviewData) {
        try {
          const parsedData = JSON.parse(storedPreviewData);
          if (parsedData.user_id) {
            console.log('🔍 Mode preview - récupération des avis pour:', parsedData.user_id);
            fetchReviews(parsedData.user_id);
          }
        } catch (error) {
          console.error('Erreur lors de la lecture des données de preview:', error);
        }
      }
    }
  }, [slug, propData, isPreview]);

  useEffect(() => {
    console.log('🚀 [MOBILE_DEBUG] Deuxième useEffect (carousel) exécuté');
    if (siteData?.media && siteData.media.length > 1) {
      console.log('🚀 [MOBILE_DEBUG] Démarrage carousel avec', siteData.media.length, 'images');
      const interval = setInterval(() => {
        setCurrentImageIndex(prev => 
          prev >= (siteData.media?.length || 1) - 1 ? 0 : prev + 1
        );
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [siteData?.media]);

  const fetchSiteData = async (retryAttempt = 0) => {
    console.log('🚀 [MOBILE_DEBUG] fetchSiteData appelé, tentative:', retryAttempt);
    if (!slug) {
      console.log('🚀 [MOBILE_DEBUG] Pas de slug, arrêt');
      return;
    }

    // Logs détaillés pour debugging mobile vs desktop
    console.log('🔍 [FETCH_SITE_DATA] Début récupération:', {
      slug,
      retryAttempt,
      isMobileDevice,
      isMobileViewport,
      connectionInfo,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    setLoading(true);
    setConnectionStatus('checking');
    
    try {
      // Configuration spécifique mobile pour éviter les timeouts
      const timeoutDuration = isMobileDevice ? 15000 : 10000;
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), timeoutDuration);

      console.log('🔍 [FETCH_SITE_DATA] Configuration requête:', {
        timeout: timeoutDuration,
        cacheStrategy: isMobileDevice ? 'no-cache' : 'default'
      });

      const { data: siteData, error } = await supabase
        .from('mini_sites')
        .select(`
          *,
          mini_site_media(*),
          mini_site_social_links(*)
        `)
        .eq('slug', normalizedSlug)
        .eq('is_published', true)
        .abortSignal(abortController.signal)
        .single();

      clearTimeout(timeoutId);

      console.log('🔍 [FETCH_SITE_DATA] Réponse Supabase:', {
        dataExists: !!siteData,
        error: error?.message,
        dataId: siteData?.id,
        isPublished: siteData?.is_published
      });

      if (error) {
        console.error('❌ [FETCH_SITE_DATA] Erreur Supabase:', error);
        throw error;
      }

      if (!siteData) {
        console.warn('⚠️ [FETCH_SITE_DATA] Aucune donnée trouvée pour le slug:', slug);
        throw new Error('Site non trouvé');
      }

      setConnectionStatus('connected');

        setSiteData({
          ...siteData,
          design_style: siteData.design_style as 'feminine' | 'masculine' | 'neutral',
          media: (siteData.mini_site_media || []).map(media => ({
            id: media.id,
            media_url: media.media_url,
            caption: media.caption || '',
            link_url: media.link_url || '',
            display_order: media.display_order || 0,
            media_type: media.media_type as 'image' | 'video' || 'image'
          })),
          social_links: (siteData.mini_site_social_links || []).map(link => ({
            id: link.id,
            platform: link.platform as 'facebook' | 'tiktok' | 'linkedin' | 'instagram' | 'x' | 'youtube',
            url: link.url
          }))
        });

      // Fetch reviews from intervention reports
      fetchReviews(siteData.user_id);
      
    } catch (error) {
      console.error('❌ [FETCH_SITE_DATA] Erreur générale:', error);
      setConnectionStatus('error');
      
      // Logique de retry avec backoff exponentiel
      const maxRetries = 3;
      const backoffDelay = Math.min(1000 * Math.pow(2, retryAttempt), 8000);
      
      if (retryAttempt < maxRetries) {
        console.log(`🔄 [FETCH_SITE_DATA] Tentative ${retryAttempt + 1}/${maxRetries} dans ${backoffDelay}ms`);
        setRetryCount(retryAttempt + 1);
        
        setTimeout(() => {
          fetchSiteData(retryAttempt + 1);
        }, backoffDelay);
        return;
      }
      
      console.error('💥 [FETCH_SITE_DATA] Échec définitif après', maxRetries, 'tentatives');
      
    } finally {
      if (retryAttempt === 0) {
        setLoading(false);
      }
    }
  };

  const fetchReviews = async (userId: string, retryAttempt = 0) => {
    console.log('🔍 [FETCH_REVIEWS] Début pour userId:', userId, {
      retryAttempt,
      isMobileDevice,
      connectionInfo
    });
    
    try {
      // Configuration robuste pour mobile
      const timeoutDuration = isMobileDevice ? 12000 : 8000;
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), timeoutDuration);

      const { data, error } = await supabase
        .from('intervention_reports')
        .select('client_rating, client_comments, created_at, patient_name')
        .eq('professional_id', userId)
        .or('client_rating.not.is.null,client_comments.not.is.null')
        .order('created_at', { ascending: false })
        .limit(20)
        .abortSignal(abortController.signal);

      clearTimeout(timeoutId);
      console.log('📊 [FETCH_REVIEWS] Données récupérées:', { data, error, count: data?.length });

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }
      
      // Filtrer les avis valides côté client
      const validReviews = (data || []).filter(review => {
        const hasRating = review.client_rating && review.client_rating >= 4;
        const hasComment = review.client_comments && review.client_comments.trim() !== '';
        console.log('🔍 Review check:', { 
          patient: review.patient_name, 
          rating: review.client_rating, 
          hasComment, 
          hasRating,
          valid: hasRating || hasComment 
        });
        return hasRating || hasComment;
      });
      
      console.log('✅ [FETCH_REVIEWS] Avis valides filtrés:', validReviews.length, validReviews);
      setReviews(validReviews);
      
    } catch (error) {
      console.error('❌ [FETCH_REVIEWS] Erreur:', error);
      
      // Retry logic pour les avis aussi
      const maxRetries = 2;
      if (retryAttempt < maxRetries && error.name !== 'AbortError') {
        console.log(`🔄 [FETCH_REVIEWS] Retry ${retryAttempt + 1}/${maxRetries}`);
        setTimeout(() => {
          fetchReviews(userId, retryAttempt + 1);
        }, 2000);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-lg font-medium">
            {connectionStatus === 'checking' && 'Chargement du mini-site...'}
            {connectionStatus === 'error' && retryCount > 0 && `Reconnexion en cours (${retryCount}/3)...`}
          </div>
          {isMobileDevice && (
            <div className="text-sm text-muted-foreground">
              Optimisation mobile en cours...
            </div>
          )}
          {connectionStatus === 'error' && retryCount > 0 && (
            <div className="text-sm text-yellow-600">
              Connexion instable détectée, tentative de reconnexion...
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!siteData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold mb-4">
            {connectionStatus === 'error' ? 'Erreur de connexion' : 'Mini-site non trouvé'}
          </h1>
          <p className="text-muted-foreground">
            {connectionStatus === 'error' 
              ? 'Impossible de charger le mini-site. Vérifiez votre connexion.'
              : 'Ce mini-site n\'existe pas ou n\'est pas publié.'
            }
          </p>
          {connectionStatus === 'error' && (
            <Button 
              onClick={() => fetchSiteData(0)} 
              className="mt-4"
              variant="outline"
            >
              Réessayer
            </Button>
          )}
          {isMobileDevice && connectionStatus === 'error' && (
            <div className="text-xs text-muted-foreground mt-2">
              Problème de connexion mobile détecté
            </div>
          )}
        </div>
      </div>
    );
  }

  const theme = colorThemes[siteData.color_palette as keyof typeof colorThemes] || colorThemes.blue;
  const style = designStyles[siteData.design_style] || designStyles.neutral;
  const currentImage = siteData.media?.[currentImageIndex];

  return (
    <div className={`min-h-screen ${style.containerClass} ${siteData.design_style === 'masculine' ? `bg-gradient-to-br ${theme.masculineGradient}` : `bg-gradient-to-br ${theme.gradient}`}`}>
      <ScrollAnimation />
      
      {/* Header */}
      <header className={`bg-gradient-to-r ${theme.primary} text-white ${style.headerStyle} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/10" />
        {/* Motif en filigrane plus visible */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="watermark" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="3" fill="white" opacity="0.6"/>
                <circle cx="65" cy="65" r="2" fill="white" opacity="0.4"/>
                <circle cx="40" cy="60" r="1.5" fill="white" opacity="0.7"/>
                <circle cx="60" cy="25" r="2.5" fill="white" opacity="0.5"/>
                <circle cx="25" cy="50" r="1" fill="white" opacity="0.6"/>
                <path d="M5,15 Q25,10 45,15 T85,15" stroke="white" strokeWidth="1" fill="none" opacity="0.3"/>
                <path d="M5,65 Q25,60 45,65 T85,65" stroke="white" strokeWidth="0.8" fill="none" opacity="0.25"/>
                <polygon points="30,35 35,30 40,35 35,40" fill="white" opacity="0.4"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#watermark)"/>
          </svg>
        </div>
        {style.decorativeElement}
        <div className="container mx-auto px-4 py-5 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-5">
            {siteData.logo_url && (
              <img
                src={siteData.logo_url}
                alt="Logo"
                className="rounded-full bg-white p-1.5 shadow-lg"
                style={{ 
                  width: siteData.logo_size ? `${Math.round(parseInt(siteData.logo_size.toString()) * 0.6)}px` : '60px', 
                  height: siteData.logo_size ? `${Math.round(parseInt(siteData.logo_size.toString()) * 0.6)}px` : '60px' 
                }}
              />
            )}
            <div className="text-center md:text-left">
              <h1 className={`${style.titleFont.replace('text-4xl md:text-5xl', 'text-2xl md:text-3xl').replace('text-5xl', 'text-3xl')} mb-1`}>
                {siteData.site_name}
              </h1>
              {siteData.site_subtitle && (
                <p className={`${style.subtitleFont.replace('text-xl', 'text-lg')} opacity-90`}>{siteData.site_subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Carousel */}
      {siteData.media && siteData.media.length > 0 && (
        <section className={`relative h-64 md:h-96 overflow-hidden ${!isMobileDevice ? 'z-10' : ''}`}>
          {currentImage?.media_type === 'video' ? (
            <video
              src={currentImage.media_url}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={currentImage?.media_url}
              alt={currentImage?.caption || "Photo du carrousel"}
              className="w-full h-full object-cover"
            />
          )}
          {currentImage?.caption && (
            <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded">
              {currentImage.caption}
            </div>
          )}
          {siteData.media.length > 1 && (
            <div className="absolute bottom-4 right-4 flex gap-2">
              {siteData.media.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            {siteData.about_me && (
              <Card className={`${style.cardStyle} ${siteData.design_style === 'feminine' ? 'feminine-card-enter animate-on-scroll' : ''} ${siteData.design_style === 'masculine' ? `${theme.masculineCard} ${theme.masculineShadow} border-l-4 border-l-gradient-to-b ${theme.masculineAccent}` : `border-l-4 ${theme.cardBorder} ${theme.lightBg}`} transition-all duration-300 ${theme.hoverBg}`}>
                <CardContent className="p-6">
                  <h2 className={`${style.sectionTitleFont} mb-4 ${siteData.design_style === 'masculine' ? `bg-gradient-to-r ${theme.masculineAccent} bg-clip-text text-transparent` : theme.accent} flex items-center gap-2`}>
                    <div className={`p-2 rounded-full ${siteData.design_style === 'masculine' ? `bg-gradient-to-br ${theme.masculineAccent} text-white` : theme.iconBg} mr-2`}>
                      <span className={`${siteData.design_style === 'masculine' ? 'text-white' : theme.iconText} font-bold`}>👤</span>
                    </div>
                    Qui suis-je ?
                  </h2>
                  <div className={`prose prose-gray max-w-none p-4 rounded-lg ${siteData.design_style === 'masculine' ? `bg-gradient-to-br ${theme.masculineGradient} border border-slate-200/30` : `${theme.lightBg} ${theme.border} border`}`}>
                    {siteData.about_me.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-3">{paragraph}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Why this profession */}
            {siteData.why_this_profession && (
              <Card className={`${style.cardStyle} ${siteData.design_style === 'feminine' ? 'feminine-card-enter animate-on-scroll' : ''} ${siteData.design_style === 'masculine' ? `${theme.masculineCard} ${theme.masculineShadow} border-l-4 border-l-gradient-to-b ${theme.masculineAccent}` : `border-l-4 ${theme.cardBorder} ${theme.lightBg}`} transition-all duration-300 ${theme.hoverBg}`}>
                <CardContent className="p-6">
                  <h2 className={`${style.sectionTitleFont} mb-4 ${siteData.design_style === 'masculine' ? `bg-gradient-to-r ${theme.masculineAccent} bg-clip-text text-transparent` : theme.accent} flex items-center gap-2`}>
                    <div className={`p-2 rounded-full ${siteData.design_style === 'masculine' ? `bg-gradient-to-br ${theme.masculineAccent} text-white` : theme.iconBg} mr-2`}>
                      <span className={`${siteData.design_style === 'masculine' ? 'text-white' : theme.iconText} font-bold`}>💼</span>
                    </div>
                    Pourquoi j'ai choisi ce métier ?
                  </h2>
                  <div className={`prose prose-gray max-w-none p-4 rounded-lg ${siteData.design_style === 'masculine' ? `bg-gradient-to-br ${theme.masculineGradient} border border-slate-200/30` : `${theme.lightBg} ${theme.border} border`}`}>
                    {siteData.why_this_profession.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-3">{paragraph}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Skills and qualities */}
            {siteData.skills_and_qualities && (
              <Card className={`${style.cardStyle} ${siteData.design_style === 'feminine' ? 'feminine-card-enter animate-on-scroll' : ''} ${siteData.design_style === 'masculine' ? `${theme.masculineCard} ${theme.masculineShadow} border-l-4 border-l-gradient-to-b ${theme.masculineAccent}` : `border-l-4 ${theme.cardBorder} ${theme.lightBg}`} transition-all duration-300 ${theme.hoverBg}`}>
                <CardContent className="p-6">
                  <h2 className={`${style.sectionTitleFont} mb-4 ${siteData.design_style === 'masculine' ? `bg-gradient-to-r ${theme.masculineAccent} bg-clip-text text-transparent` : theme.accent} flex items-center gap-2`}>
                    <div className={`p-2 rounded-full ${siteData.design_style === 'masculine' ? `bg-gradient-to-br ${theme.masculineAccent} text-white` : theme.iconBg} mr-2`}>
                      <span className={`${siteData.design_style === 'masculine' ? 'text-white' : theme.iconText} font-bold`}>⭐</span>
                    </div>
                    Mes compétences et qualités
                  </h2>
                  <div className={`prose prose-gray max-w-none mb-4 p-4 rounded-lg ${siteData.design_style === 'masculine' ? `bg-gradient-to-br ${theme.masculineGradient} border border-slate-200/30` : `${theme.lightBg} ${theme.border} border`}`}>
                    {siteData.skills_and_qualities.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-3">{paragraph}</p>
                    ))}
                  </div>
                  {siteData.activity_start_date && (
                    <Badge variant="outline" className={`mt-2 ${siteData.design_style === 'masculine' ? `border-slate-300 text-slate-700 bg-gradient-to-br ${theme.masculineGradient}` : `${theme.border} ${theme.iconText} ${theme.lightBg}`} ${siteData.design_style === 'feminine' ? 'border-pink-300 text-pink-700 bg-pink-50' : ''}`}>
                      Depuis {siteData.activity_start_date}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Services */}
            {siteData.services_description && (
              <Card className={`${style.cardStyle} ${siteData.design_style === 'feminine' ? 'feminine-card-enter animate-on-scroll' : ''} ${siteData.design_style === 'masculine' ? `${theme.masculineCard} ${theme.masculineShadow} border-l-4 border-l-gradient-to-b ${theme.masculineAccent}` : `border-l-4 ${theme.cardBorder} ${theme.lightBg}`} transition-all duration-300 ${theme.hoverBg}`}>
                <CardContent className="p-6">
                  <h2 className={`${style.sectionTitleFont} mb-4 ${siteData.design_style === 'masculine' ? `bg-gradient-to-r ${theme.masculineAccent} bg-clip-text text-transparent` : theme.accent} flex items-center gap-2`}>
                    <div className={`p-2 rounded-full ${siteData.design_style === 'masculine' ? `bg-gradient-to-br ${theme.masculineAccent} text-white` : theme.iconBg} mr-2`}>
                      <span className={`${siteData.design_style === 'masculine' ? 'text-white' : theme.iconText} font-bold`}>🛍️</span>
                    </div>
                    Mes offres
                  </h2>
                  <div className={`prose prose-gray max-w-none p-4 rounded-lg ${siteData.design_style === 'masculine' ? `bg-gradient-to-br ${theme.masculineGradient} border border-slate-200/30` : `${theme.lightBg} ${theme.border} border`}`}>
                    {siteData.services_description.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-3">{paragraph}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Availability */}
            {(siteData.availability_schedule || siteData.intervention_radius) && (
              <Card className={`${style.cardStyle} ${siteData.design_style === 'feminine' ? 'feminine-card-enter animate-on-scroll mb-6' : ''} ${reviews.length > 0 ? 'mb-6' : ''} ${siteData.design_style === 'masculine' ? `${theme.masculineCard} ${theme.masculineShadow} border-l-4 border-l-gradient-to-b ${theme.masculineAccent}` : `border-l-4 ${theme.cardBorder} ${theme.lightBg}`} transition-all duration-300 ${theme.hoverBg}`}>
                <CardContent className="p-6">
                  <h2 className={`${style.sectionTitleFont} mb-4 ${siteData.design_style === 'masculine' ? `bg-gradient-to-r ${theme.masculineAccent} bg-clip-text text-transparent` : theme.accent} flex items-center gap-2`}>
                    <div className={`p-2 rounded-full ${siteData.design_style === 'masculine' ? `bg-gradient-to-br ${theme.masculineAccent} text-white` : theme.iconBg} mr-2`}>
                      <span className={`${siteData.design_style === 'masculine' ? 'text-white' : theme.iconText} font-bold`}>📅</span>
                    </div>
                    Mes disponibilités
                  </h2>
                  {siteData.availability_schedule && (
                    <div className={`mb-4 p-4 rounded-lg ${siteData.design_style === 'masculine' ? `bg-gradient-to-br ${theme.masculineGradient} border border-slate-200/30` : `${theme.lightBg} ${theme.border} border`}`}>
                      <h3 className={`font-semibold mb-2 ${siteData.design_style === 'masculine' ? `bg-gradient-to-r ${theme.masculineAccent} bg-clip-text text-transparent` : theme.accent}`}>Planning</h3>
                      <div className="prose prose-gray max-w-none">
                        {siteData.availability_schedule.split('\n').map((paragraph, index) => (
                          <p key={index} className="mb-2">{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {siteData.intervention_radius && (
                    <div className={`p-4 rounded-lg ${siteData.design_style === 'masculine' ? `bg-gradient-to-br ${theme.masculineGradient} border border-slate-200/30` : `${theme.lightBg} ${theme.border} border`}`}>
                      <h3 className={`font-semibold mb-2 ${siteData.design_style === 'masculine' ? `bg-gradient-to-r ${theme.masculineAccent} bg-clip-text text-transparent` : theme.accent}`}>Zone d'intervention</h3>
                      <div className="prose prose-gray max-w-none">
                        {siteData.intervention_radius.split('\n').map((paragraph, index) => (
                          <p key={index} className="mb-2">{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <Card className={`${style.cardStyle} ${siteData.design_style === 'feminine' ? 'feminine-card-enter animate-on-scroll' : ''} ${siteData.design_style === 'masculine' ? `${theme.masculineCard} ${theme.masculineShadow} border-l-4 border-l-gradient-to-b ${theme.masculineAccent}` : `border-l-4 ${theme.cardBorder} ${theme.lightBg}`} transition-all duration-300 ${theme.hoverBg}`}>
                <CardContent className="p-6">
                  <h2 className={`${style.sectionTitleFont} mb-4 ${theme.accent} flex items-center gap-2`}>
                    <div className={`p-2 rounded-full ${theme.iconBg} mr-2`}>
                      <span className={`${theme.iconText} font-bold`}>⭐</span>
                    </div>
                    Avis clients
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {reviews.map((review, index) => (
                       <div key={index} className={`border rounded-lg p-4 shadow-sm ${siteData.design_style === 'masculine' ? theme.lightBg : 'bg-white'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.client_rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-gray-400">
                            {new Date(review.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <p className="text-sm text-gray-700 mb-2 italic">
                          "{review.client_comments}"
                        </p>
                        {review.patient_name && (
                          <p className="text-xs text-gray-500">
                            - {review.patient_name}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className={`sticky top-4 ${style.cardStyle}`}>
              <CardContent className="p-6">
                <h2 className={`${style.sectionTitleFont} mb-6 ${siteData.design_style === 'masculine' ? `bg-gradient-to-r ${theme.masculineAccent} bg-clip-text text-transparent` : theme.accent} flex items-center gap-2`}>
                  <div className={`p-2 rounded-full ${siteData.design_style === 'masculine' ? `bg-gradient-to-br ${theme.masculineAccent} text-white` : theme.iconBg} mr-2`}>
                    <span className={`${siteData.design_style === 'masculine' ? 'text-white' : theme.iconText} font-bold`}>📞</span>
                  </div>
                  Me contacter
                </h2>
                
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold">
                      {siteData.first_name} {siteData.last_name}
                    </h3>
                    {siteData.profession && (
                      <p className="text-gray-600">{siteData.profession}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className={`flex items-center gap-3 p-3 rounded-lg ${theme.lightBg} ${theme.border} border transition-all duration-300 ${theme.hoverBg}`}>
                      <div className={`p-2 rounded-full ${theme.iconBg}`}>
                        <Mail className={`w-5 h-5 ${theme.iconText}`} />
                      </div>
                      <a 
                        href={`mailto:${siteData.email}`}
                        className={`${theme.accent} hover:underline font-medium flex-1`}
                      >
                        {siteData.email}
                      </a>
                    </div>
                    
                    {siteData.phone && (
                      <div className={`flex items-center gap-3 p-3 rounded-lg ${theme.lightBg} ${theme.border} border transition-all duration-300 ${theme.hoverBg}`}>
                        <div className={`p-2 rounded-full ${theme.iconBg}`}>
                          <Phone className={`w-5 h-5 ${theme.iconText}`} />
                        </div>
                        <a 
                          href={`tel:${siteData.phone}`}
                          className={`${theme.accent} hover:underline font-medium flex-1`}
                        >
                          {siteData.phone}
                        </a>
                      </div>
                    )}
                    
                    {siteData.postal_code && (
                      <div className={`flex items-center gap-3 p-3 rounded-lg ${theme.lightBg} ${theme.border} border`}>
                        <div className={`p-2 rounded-full ${theme.iconBg}`}>
                          <MapPin className={`w-5 h-5 ${theme.iconText}`} />
                        </div>
                        <span className={`${theme.accent} font-medium flex-1`}>{siteData.postal_code}</span>
                      </div>
                    )}
                  </div>

                  <Button 
                    className={`w-full ${theme.button} text-white ${style.buttonStyle}`}
                    onClick={() => window.location.href = `mailto:${siteData.email}`}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Envoyer un message
                  </Button>

                  {siteData.social_links && siteData.social_links.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Suivez-moi</h4>
                      <div className="flex gap-3">
                        {siteData.social_links.map((link, index) => {
                          const IconComponent = socialIcons[link.platform];
                          return (
                            <a
                              key={index}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`p-2 rounded-full ${theme.button} text-white hover:opacity-80 transition-opacity`}
                            >
                              <IconComponent />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Professional networks */}
            {siteData.professional_networks && (
              <Card className={style.cardStyle}>
                <CardContent className="p-6">
                  <h3 className={`${style.sectionTitleFont} mb-3 ${siteData.design_style === 'masculine' ? `bg-gradient-to-r ${theme.masculineAccent} bg-clip-text text-transparent` : theme.accent} flex items-center gap-2`}>
                    <div className={`p-2 rounded-full ${siteData.design_style === 'masculine' ? `bg-gradient-to-br ${theme.masculineAccent} text-white` : theme.iconBg} mr-2`}>
                      <span className={`${siteData.design_style === 'masculine' ? 'text-white' : theme.iconText} font-bold`}>🌐</span>
                    </div>
                    Réseaux professionnels
                  </h3>
                  <div className="prose prose-sm prose-gray max-w-none">
                    {siteData.professional_networks.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-2">{paragraph}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} {siteData.first_name} {siteData.last_name}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Mini-site créé avec CaprIA
          </p>
        </div>
      </footer>
    </div>
  );
};