import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { Shield, Building2, CheckCircle } from 'lucide-react';

export default function ContextBanner() {
  const { activeTenant, isPlatformMode, loading } = useGlobalContext();

  if (loading || !activeTenant) return null;

  return null;
































}