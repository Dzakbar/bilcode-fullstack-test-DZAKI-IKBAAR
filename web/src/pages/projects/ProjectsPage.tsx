import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../auth/AuthContext'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Modal } from '../../components/Modal'
import { ProjectForm, type ProjectFieldErrors } from '../../components/ProjectForm'
import { Toast, type ToastMessage, type ToastType } from '../../components/Toast'
import { getClients } from '../../services/clientService'
import { createProject, deleteProject, getProjects, updateProject } from '../../services/projectService'
import type { Client } from '../../types/client'
import type { Project, ProjectFormData } from '../../types/project'
import { getApiErrorDetails } from '../../utils/apiError'

type ModalMode = 'create' | 'edit'

const emptyForm: ProjectFormData = {
  name: '',
  client_id: '',
  status: 'active',
  description: '',
  due_date: '',
}

function firstFieldError(errors: Record<string, string[]> | undefined, field: string): string | undefined {
  return errors?.[field]?.[0]
}

function projectToFormData(project: Project): ProjectFormData {
  return {
    name: project.name,
    client_id: String(project.client?.id ?? ''),
    status: project.status,
    description: project.brief ?? '',
    due_date: project.deadline ?? '',
  }
}

export function ProjectsPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('create')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [formData, setFormData] = useState<ProjectFormData>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<ProjectFieldErrors>({})
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const formTitle = modalMode === 'create' ? 'Create project' : 'Edit project'
  const formDescription =
    modalMode === 'create'
      ? 'Add a new project record and connect it to a client.'
      : 'Update details for this project record.'
  const submitLabel = modalMode === 'create' ? 'Create Project' : 'Save Changes'

  const hasProjects = projects.length > 0

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now()
    setToasts((current) => [...current, { id, type, message }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 4500)
  }, [])

  const handleAuthError = useCallback(
    async (status?: number) => {
      if (status !== 401) {
        return false
      }

      await logout()
      navigate('/login', { replace: true })
      return true
    },
    [logout, navigate],
  )

  const loadData = useCallback(async () => {
    setIsLoading(true)

    try {
      const [projectsResponse, clientsResponse] = await Promise.all([getProjects(), getClients()])
      setProjects(projectsResponse.data)
      setClients(clientsResponse.data)
    } catch (error) {
      const details = getApiErrorDetails(error)

      if (await handleAuthError(details.status)) {
        return
      }

      addToast('error', details.message)
    } finally {
      setIsLoading(false)
    }
  }, [addToast, handleAuthError])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedProject(null)
    setFormData(emptyForm)
    setFieldErrors({})
    setIsFormOpen(true)
  }

  const openEditModal = (project: Project) => {
    setModalMode('edit')
    setSelectedProject(project)
    setFormData(projectToFormData(project))
    setFieldErrors({})
    setIsFormOpen(true)
  }

  const closeFormModal = () => {
    if (isSubmitting) {
      return
    }

    setIsFormOpen(false)
    setSelectedProject(null)
    setFieldErrors({})
    setFormData(emptyForm)
  }

  const validate = () => {
    const nextErrors: ProjectFieldErrors = {}

    if (!formData.name.trim()) {
      nextErrors.name = 'Project name is required.'
    }

    if (!formData.client_id) {
      nextErrors.client_id = 'Client is required.'
    }

    if (!formData.status) {
      nextErrors.status = 'Status is required.'
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      if (modalMode === 'edit' && selectedProject) {
        const updatedProject = await updateProject(selectedProject.id, formData)
        setProjects((current) => current.map((p) => (p.id === updatedProject.id ? updatedProject : p)))
        addToast('success', 'Project updated successfully.')
      } else {
        const createdProject = await createProject(formData)
        setProjects((current) => [createdProject, ...current])
        addToast('success', 'Project created successfully.')
      }

      closeFormModal()
    } catch (error) {
      const details = getApiErrorDetails(error)

      if (await handleAuthError(details.status)) {
        return
      }

      setFieldErrors({
        name: firstFieldError(details.fieldErrors, 'name'),
        client_id: firstFieldError(details.fieldErrors, 'client_id'),
        status: firstFieldError(details.fieldErrors, 'status'),
        brief: firstFieldError(details.fieldErrors, 'brief'),
        deadline: firstFieldError(details.fieldErrors, 'deadline'),
      })
      addToast('error', details.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!projectToDelete) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteProject(projectToDelete.id)
      setProjects((current) => current.filter((p) => p.id !== projectToDelete.id))
      setProjectToDelete(null)
      addToast('success', 'Project deleted successfully.')
    } catch (error) {
      const details = getApiErrorDetails(error)

      if (await handleAuthError(details.status)) {
        return
      }

      addToast('error', details.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const rows = useMemo(
    () =>
      projects.map((project) => (
        <tr className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50" key={project.id}>
          <td className="px-5 py-4">
            <div className="font-semibold text-neutral-950">{project.name}</div>
          </td>
          <td className="px-5 py-4 text-neutral-700">{project.client?.name ?? '-'}</td>
          <td className="px-5 py-4 text-neutral-700">{project.tasks_count ?? 0}</td>
          <td className="px-5 py-4 text-neutral-700">{project.deadline ?? '-'}</td>
          <td className="px-5 py-4">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                project.status === 'completed'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : project.status === 'planning'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : project.status === 'cancelled'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {project.status}
            </span>
          </td>
          <td className="px-5 py-4">
            <div className="flex justify-end gap-2">
              <button
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100"
                type="button"
                onClick={() => openEditModal(project)}
              >
                Edit
              </button>
              <button
                className="rounded-lg px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950"
                type="button"
                onClick={() => setProjectToDelete(project)}
              >
                Delete
              </button>
            </div>
          </td>
        </tr>
      )),
    [projects],
  )

  return (
    <section className="mx-auto grid max-w-6xl gap-6" aria-labelledby="projects-heading">
      <Toast toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-wider text-neutral-500">Projects</p>
          <h1 id="projects-heading" className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
            Project management
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            Manage projects, associate clients, and track project status in one clean workspace.
          </p>
        </div>
        <button
          className="inline-flex h-11 items-center justify-center rounded-lg border border-neutral-950 bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
          type="button"
          onClick={openCreateModal}
        >
          Create Project
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div>
            <h2 className="m-0 text-base font-semibold text-neutral-950">Projects</h2>
            <p className="mt-1 text-sm text-neutral-500">{isLoading ? 'Loading records...' : `${projects.length} records`}</p>
          </div>
          <button
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={isLoading}
            onClick={() => void loadData()}
          >
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="grid gap-3 p-5" role="status" aria-live="polite">
            {[0, 1, 2].map((item) => (
              <div className="h-14 animate-pulse rounded-lg bg-neutral-100" key={item} />
            ))}
          </div>
        ) : null}

        {!isLoading && !hasProjects ? (
          <div className="grid min-h-72 place-items-center px-6 py-12 text-center">
            <div>
              <h2 className="text-xl font-semibold text-neutral-950">No projects yet</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-600">
                Create your first project record to start organizing client work.
              </p>
              <button
                className="mt-5 inline-flex h-11 items-center justify-center rounded-lg border border-neutral-950 bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
                type="button"
                onClick={openCreateModal}
              >
                Create Project
              </button>
            </div>
          </div>
        ) : null}

        {!isLoading && hasProjects ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-xs font-bold uppercase tracking-wider text-neutral-500">
                  <th className="px-5 py-3" scope="col">
                    Project Name
                  </th>
                  <th className="px-5 py-3" scope="col">
                    Client Name
                  </th>
                  <th className="px-5 py-3" scope="col">
                    Tasks Count
                  </th>
                  <th className="px-5 py-3" scope="col">
                    Due Date
                  </th>
                  <th className="px-5 py-3" scope="col">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right" scope="col">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>{rows}</tbody>
            </table>
          </div>
        ) : null}
      </div>

      <Modal isOpen={isFormOpen} title={formTitle} description={formDescription} onClose={closeFormModal}>
        <ProjectForm
          clients={clients}
          data={formData}
          errors={fieldErrors}
          isSubmitting={isSubmitting}
          submitLabel={submitLabel}
          onCancel={closeFormModal}
          onChange={(field, value) => {
            setFormData((current) => ({ ...current, [field]: value }))
            setFieldErrors((current) => ({ ...current, [field]: undefined }))
          }}
          onSubmit={(event) => void handleSubmit(event)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(projectToDelete)}
        title="Delete project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setProjectToDelete(null)
          }
        }}
        onConfirm={() => void handleDelete()}
      />
    </section>
  )
}
