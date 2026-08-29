import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  UserPlus, 
  CalendarPlus,
  ChevronRight,
  Database
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { InstallPWAButton } from './InstallPWAButton';
import type { AuthUser } from '../types/auth';

export type AppView = 'dashboard' | 'pacientes' | 'novo-paciente' | 'paciente-perfil';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  user: AuthUser | null;
  onLogout: () => void;
  onOpenNewPatient: () => void;
  onOpenNewConsultation: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  user,
  onLogout,
  onOpenNewPatient,
  onOpenNewConsultation,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const getInitials = (name?: string) => {
    if (!name) return 'N';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Visão geral e métricas',
    },
    {
      id: 'pacientes' as const,
      label: 'Pacientes',
      icon: Users,
      description: 'Gestão e prontuários',
    },
  ];

  const handleNavClick = (view: 'dashboard' | 'pacientes') => {
    onNavigate(view);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200/80 
          flex flex-col justify-between transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Top Section: Logo & Main Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <BrandLogo size="md" />
          </div>

          {/* Quick Action Buttons */}
          <div className="p-4 space-y-2">
            <button
              type="button"
              onClick={() => {
                onOpenNewPatient();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Paciente</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenNewConsultation();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 font-medium rounded-xl text-xs flex items-center justify-center gap-2 border border-emerald-200/60 transition-all cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4 text-emerald-600" />
              <span>Registrar Consulta</span>
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="px-3 py-2 space-y-1.5 flex-1">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Menu Principal
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold
                    transition-all group cursor-pointer text-left
                    ${isActive 
                      ? 'bg-emerald-50 text-emerald-800 shadow-xs border border-emerald-200/70' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      p-2 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'}
                    `}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold">{item.label}</div>
                      <div className="text-[10px] font-normal text-slate-400">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-emerald-600 translate-x-0.5' : 'text-slate-300 group-hover:text-slate-400'}`} />
                </button>
              );
            })}
          </nav>

          {/* PWA Install Button */}
          <div className="px-3 pb-2">
            <InstallPWAButton />
          </div>

          {/* Realtime Database badge */}
          <div className="p-4 mx-3 mb-3 rounded-xl bg-gradient-to-br from-slate-50 to-emerald-50/40 border border-slate-200/60 text-slate-600">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Neon PostgreSQL</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Dados em tempo real</span>
            </div>
          </div>
        </div>

        {/* Bottom Section: User Profile & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                {getInitials(user?.name)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-800 truncate" title={user?.name}>
                  {user?.name || 'Nutricionista'}
                </span>
                <span className="text-[10px] text-slate-400 truncate" title={user?.email}>
                  {user?.email}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              title="Sair do sistema"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
