'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api/projects';
import { Project, ProjectFormData, ProjectStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Building2 } from 'lucide-react';
import { ProjectForm } from '@/app/(dashboard)/projects/_components/project-form';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/shared/data-table/data-table';
import { createProjectsColumns } from '@/app/(dashboard)/projects/_components/projects-columns';
import { EmptyState } from '@/components/shared/empty-state';
import { toast } from 'sonner';

export default function ProjectsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const queryClient = useQueryClient();

  // Define columns
  const columns = useMemo(
    () =>
      createProjectsColumns(
        (project) => {
          setSelectedProject(project);
          setIsEditDialogOpen(true);
        },
        (project) => {
          setSelectedProject(project);
          setIsDeleteDialogOpen(true);
        },
        (project) => {
          router.push(`/projects/${project.id}`);
        }
      ),
    [router]
  );

  const { data, isLoading } = useQuery({
    queryKey: ['projects', { page, search, status: statusFilter }],
    queryFn: () => projectsApi.getAll({
      page,
      search,
      status: statusFilter !== 'all' ? statusFilter as ProjectStatus : undefined,
      per_page: 15
    }),
  });

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsCreateDialogOpen(false);
      toast.success('Progetto creato con successo');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProjectFormData }) => projectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsEditDialogOpen(false);
      setSelectedProject(null);
      toast.success('Progetto aggiornato');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: projectsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsDeleteDialogOpen(false);
      setSelectedProject(null);
      toast.success('Progetto eliminato');
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progetti"
        description="Gestisci i progetti attivi e pianificati"
        icon={Building2}
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Progetto
          </Button>
        }
      />

      {/* Filtri in Card */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Cerca progetti..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 h-11 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              <SelectItem value="planned">Pianificato</SelectItem>
              <SelectItem value="active">Attivo</SelectItem>
              <SelectItem value="on_hold">In Pausa</SelectItem>
              <SelectItem value="completed">Completato</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        storageKey="projects-table"
        onRowClick={(project) => router.push(`/projects/${project.id}`)}
        emptyState={
          <EmptyState
            icon={Building2}
            title="Nessun progetto trovato"
            description="Inizia creando il tuo primo progetto"
            actionLabel="Nuovo Progetto"
            onAction={() => setIsCreateDialogOpen(true)}
          />
        }
      />

      {data && data.meta.last_page > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-600">
            Mostrando <span className="font-medium">{data.meta.from}</span> a{' '}
            <span className="font-medium">{data.meta.to}</span> di{' '}
            <span className="font-medium">{data.meta.total}</span> progetti
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
              Precedente
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === data.meta.last_page}>
              Successiva
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">Nuovo Progetto</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">Crea un nuovo progetto</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 py-6">
            <ProjectForm onSubmit={(data) => createMutation.mutate(data)} onCancel={() => setIsCreateDialogOpen(false)} isLoading={createMutation.isPending} />
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={createMutation.isPending}>Annulla</Button>
              <Button type="submit" form="project-form" disabled={createMutation.isPending}>{createMutation.isPending ? 'Salvataggio...' : 'Crea Progetto'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">Modifica Progetto</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">Aggiorna i dettagli del progetto</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 py-6">
            {selectedProject && (
              <ProjectForm project={selectedProject} onSubmit={(data) => updateMutation.mutate({ id: selectedProject.id, data })} onCancel={() => { setIsEditDialogOpen(false); setSelectedProject(null); }} isLoading={updateMutation.isPending} />
            )}
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedProject(null); }} disabled={updateMutation.isPending}>Annulla</Button>
              <Button type="submit" form="project-form" disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Salvataggio...' : 'Aggiorna Progetto'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900">Elimina Progetto</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Confermi eliminazione <span className="font-semibold text-slate-900">{selectedProject?.code}</span>?
              <br />
              <span className="text-red-600 font-medium">Questa azione non può essere annullata.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedProject(null)}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedProject && deleteMutation.mutate(selectedProject.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Elimina Progetto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
