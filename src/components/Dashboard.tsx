import React, { useState, useEffect, useCallback } from 'react';
import { 
  Menu, 
  X, 
  CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Sidebar, type AppView } from './Sidebar';
import { DashboardView } from './DashboardView';
import { PatientsList } from './PatientsList';
import { NewPatientForm } from './NewPatientForm';
import { PatientProfileView } from './PatientProfileView';
import { NewConsultationModal } from './NewConsultationModal';
import { BrandLogo } from './BrandLogo';
import { 
  resolveNutricionista, 
  getDashboardStats, 
  seedSampleData 
} from '../lib/neon-db';
import type { DashboardStats, Nutricionista, Paciente } from '../types/database';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Neon DB states
  const [nutricionista, setNutricionista] = useState<Nutricionista | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Patient Selection & Modal states
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isNewConsultationModalOpen, setIsNewConsultationModalOpen] = useState(false);
  const [consultationTargetPatientId, setConsultationTargetPatientId] = useState<string | undefined>(undefined);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // 1. Resolve logged in nutritionist in Neon
  useEffect(() => {
    let mounted = true;

    async function initNutricionista() {
      if (!user) return;
      try {
        const nutri = await resolveNutricionista(user);
        if (mounted) {
          setNutricionista(nutri);
        }
      } catch (err: any) {
        console.error('Error resolving nutritionist:', err);
      }
    }

    initNutricionista();
    return () => {
      mounted = false;
    };
  }, [user]);

  // 2. Fetch dashboard statistics from Neon
  const loadStats = useCallback(async () => {
    if (!nutricionista?.id) return;
    setLoadingStats(true);
    setStatsError(null);
    try {
      const data = await getDashboardStats(nutricionista.id);
      setStats(data);
    } catch (err: any) {
      console.error('Error loading dashboard stats:', err);
      setStatsError(err.message || 'Erro ao carregar estatísticas do Neon.');
    } finally {
      setLoadingStats(false);
    }
  }, [nutricionista?.id]);

  useEffect(() => {
    if (nutricionista?.id) {
      loadStats();
    }
  }, [nutricionista?.id, loadStats]);

  // Seed sample data helper
  const handleSeedDemoData = async () => {
    if (!nutricionista?.id) return;
    setSeedingDemo(true);
    try {
      await seedSampleData(nutricionista.id);
      showToast('Dados de teste populados com sucesso no Neon!');
      await loadStats();
    } catch (err: any) {
      showToast(`Erro ao popular dados: ${err.message || 'Tente novamente'}`);
    } finally {
      setSeedingDemo(false);
    }
  };

  // Navigation handlers
  const handleNavigateToNewPatient = () => {
    setCurrentView('novo-paciente');
  };

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentView('paciente-perfil');
  };

  const handlePatientCreated = (newPatient: Paciente) => {
    showToast(`Paciente "${newPatient.nome}" cadastrado com sucesso!`);
    loadStats();
    setSelectedPatientId(newPatient.id);
    setCurrentView('paciente-perfil');
  };

  const [profileRefreshKey, setProfileRefreshKey] = useState(0);

  const handleConsultationCreated = () => {
    setIsNewConsultationModalOpen(false);
    setConsultationTargetPatientId(undefined);
    setProfileRefreshKey((prev) => prev + 1);
    showToast('Consulta registrada com sucesso no Neon!');
    loadStats();
  };

  const handleOpenNewConsultation = (patientId?: string) => {
    setConsultationTargetPatientId(patientId);
    setIsNewConsultationModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Fixed Sidebar for desktop and drawer for mobile */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        user={user}
        onLogout={logout}
        onOpenNewPatient={handleNavigateToNewPatient}
        onOpenNewConsultation={() => handleOpenNewConsultation()}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-2xs">
          <BrandLogo size="sm" />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Page Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {currentView === 'dashboard' && (
            <DashboardView
              user={user}
              stats={stats}
              loading={loadingStats}
              error={statsError}
              onRefresh={loadStats}
              onSelectPatient={handleSelectPatient}
              onNavigateToPatients={() => setCurrentView('pacientes')}
              onOpenNewPatient={handleNavigateToNewPatient}
              onOpenNewConsultation={() => handleOpenNewConsultation()}
              onSeedDemoData={handleSeedDemoData}
              seedingDemo={seedingDemo}
            />
          )}

          {currentView === 'pacientes' && (
            <PatientsList
              nutricionistaId={nutricionista?.id || user?.id || ''}
              onSelectPatient={handleSelectPatient}
              onOpenNewPatient={handleNavigateToNewPatient}
              onOpenNewConsultation={handleOpenNewConsultation}
            />
          )}

          {currentView === 'novo-paciente' && (
            <NewPatientForm
              nutricionistaId={nutricionista?.id || user?.id || ''}
              onCancel={() => setCurrentView('pacientes')}
              onSuccess={handlePatientCreated}
            />
          )}

          {currentView === 'paciente-perfil' && selectedPatientId && (
            <PatientProfileView
              key={`${selectedPatientId}-${profileRefreshKey}`}
              patientId={selectedPatientId}
              nutricionistaId={nutricionista?.id || user?.id || ''}
              onBackToList={() => setCurrentView('pacientes')}
              onOpenNewConsultation={handleOpenNewConsultation}
              onPatientUpdated={() => loadStats()}
              onPatientDeleted={() => {
                setSelectedPatientId(null);
                setCurrentView('pacientes');
                loadStats();
              }}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Modal: Add New Consultation */}
      {isNewConsultationModalOpen && (nutricionista?.id || user?.id) && (
        <NewConsultationModal
          nutricionistaId={nutricionista?.id || user?.id || ''}
          defaultPatientId={consultationTargetPatientId}
          onClose={() => {
            setIsNewConsultationModalOpen(false);
            setConsultationTargetPatientId(undefined);
          }}
          onSuccess={handleConsultationCreated}
        />
      )}
    </div>
  );
};
