import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../../auth/AuthContext'
import { Alert } from '../../components/Alert'
import { ApiErrorState } from '../../components/ApiErrorState'
import { Button } from '../../components/Button'
import { LoadingState } from '../../components/LoadingState'
import { PageHeader } from '../../components/PageHeader'
import { TextInput } from '../../components/TextInput'
import { getClients } from '../../services/clientService'
import { createProject, getProject, updateProject } from '../../services/projectService'
import { getMembers } from '../../services/userService'
import type { Client } from '../../types/client'
import type { Member } from '../../types/member'
import type { ProjectFormData, ProjectStatus } from '../../types/project'
import { getApiErrorDetails } from '../../utils/apiError'

type FieldErrors = Partial<Record<keyof ProjectFormData | 'brief' | 'deadline', string>>

const statusOptions: ProjectStatus[] = ['planning', 'active', 'completed']

const emptyForm: ProjectFormData = {
  name: '',
  description: '',
  client_id: '',
  member_ids: [],
  start_date: '',
  due_date: '',
  status: 'planning',
}

function firstFieldError(errors: Record<string, string[]> | undefined, field: keyof ProjectFormData | 'brief' | 'deadline') {
  return errors?.[field]?.[0]
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ')
}

export function ProjectFormPage() {
  const { id } = useParams()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)
  const [formData, setFormData] = useState<ProjectFormData>(emptyForm)
  const [clients, setClients] = useState<Client[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const pageCopy = useMemo(
    () => ({
      title: isEditMode ? 'Edit project' : 'Create project',
      description: isEditMode ? 'Update project delivery details.' : 'Create a project and connect it to a client.',
      submitLabel: isEditMode ? 'Save Changes' : 'Create Project',
    }),
    [isEditMode],
  )

  useEffect(() => {
    let isMounted = true

    async function loadFormData() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const [clientsResponse, membersResponse, project] = await Promise.all([
          getClients(),
          getMembers(),
          id ? getProject(id) : Promise.resolve(null),
        ])

        if (!isMounted) {
          return
        }

        setClients(clientsResponse.data)
        setMembers(membersResponse.data)

        if (project) {
          setFormData({
            name: project.name,
            description: project.brief ?? '',
            client_id: String(project.client.id),
            member_ids: [],
            start_date: '',
            due_date: project.deadline ?? '',
            status: project.status === 'cancelled' ? 'planning' : project.status,
          })
        }
      } catch (error) {
        const details = getApiErrorDetails(error)

        if (details.status === 401) {
          await logout()
          navigate('/login', { replace: true })
          return
        }

        if (isMounted) {
          setLoadError(details.message)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadFormData()

    return () => {
      isMounted = false
    }
  }, [id, logout, navigate])

  const validate = () => {
    const nextErrors: FieldErrors = {}

    if (!formData.name.trim()) {
      nextErrors.name = 'Name is required.'
    }

    if (!formData.client_id) {
      nextErrors.client_id = 'Client is required.'
    }

    setFieldErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditMode && id) {
        await updateProject(id, formData)
      } else {
        await createProject(formData)
      }

      navigate('/projects')
    } catch (error) {
      const details = getApiErrorDetails(error)

      if (details.status === 401) {
        await logout()
        navigate('/login', { replace: true })
        return
      }

      setFormError(details.message)
      setFieldErrors({
        name: firstFieldError(details.fieldErrors, 'name'),
        client_id: firstFieldError(details.fieldErrors, 'client_id'),
        description: firstFieldError(details.fieldErrors, 'brief'),
        due_date: firstFieldError(details.fieldErrors, 'deadline'),
        status: firstFieldError(details.fieldErrors, 'status'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="page project-form-page" aria-labelledby="project-form-heading">
      <PageHeader eyebrow="Projects" title={pageCopy.title} description={pageCopy.description} />

      {isLoading ? <LoadingState label="Loading project form" /> : null}

      {!isLoading && loadError ? <ApiErrorState message={loadError} /> : null}

      {!isLoading && !loadError ? (
        <form className="client-form project-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
          {formError ? <Alert title="Unable to save project">{formError}</Alert> : null}
          <TextInput
            label="Name"
            name="name"
            value={formData.name}
            error={fieldErrors.name}
            required
            onChange={(event) => {
              setFormData((current) => ({ ...current, name: event.target.value }))
              setFieldErrors((current) => ({ ...current, name: undefined }))
            }}
          />

          <div className="form-field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              aria-describedby={fieldErrors.description ? 'description-error' : undefined}
              aria-invalid={Boolean(fieldErrors.description)}
              rows={5}
              onChange={(event) => {
                setFormData((current) => ({ ...current, description: event.target.value }))
                setFieldErrors((current) => ({ ...current, description: undefined }))
              }}
            />
            {fieldErrors.description ? (
              <p className="field-error" id="description-error">
                {fieldErrors.description}
              </p>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="client_id">Client</label>
            <select
              id="client_id"
              name="client_id"
              value={formData.client_id}
              aria-describedby={fieldErrors.client_id ? 'client-id-error' : undefined}
              aria-invalid={Boolean(fieldErrors.client_id)}
              required
              onChange={(event) => {
                setFormData((current) => ({ ...current, client_id: event.target.value }))
                setFieldErrors((current) => ({ ...current, client_id: undefined }))
              }}
            >
              <option value="">Select client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company ? `${client.name} - ${client.company}` : client.name}
                </option>
              ))}
            </select>
            {fieldErrors.client_id ? (
              <p className="field-error" id="client-id-error">
                {fieldErrors.client_id}
              </p>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="member_ids">Members</label>
            <select id="member_ids" name="member_ids" value={formData.member_ids} multiple disabled>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.profession ?? 'member'})
                </option>
              ))}
            </select>
            <p className="form-help">Project member assignment is not available in the current Projects API.</p>
          </div>

          <TextInput
            label="Start date"
            name="start_date"
            type="date"
            value={formData.start_date}
            disabled
            onChange={(event) => {
              setFormData((current) => ({ ...current, start_date: event.target.value }))
            }}
          />

          <TextInput
            label="Due date"
            name="due_date"
            type="date"
            value={formData.due_date}
            error={fieldErrors.due_date}
            onChange={(event) => {
              setFormData((current) => ({ ...current, due_date: event.target.value }))
              setFieldErrors((current) => ({ ...current, due_date: undefined }))
            }}
          />

          <div className="form-field">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              aria-describedby={fieldErrors.status ? 'status-error' : undefined}
              aria-invalid={Boolean(fieldErrors.status)}
              onChange={(event) => {
                setFormData((current) => ({ ...current, status: event.target.value as ProjectStatus }))
                setFieldErrors((current) => ({ ...current, status: undefined }))
              }}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>
            {fieldErrors.status ? (
              <p className="field-error" id="status-error">
                {fieldErrors.status}
              </p>
            ) : null}
          </div>

          <div className="form-actions">
            <Button type="submit" isLoading={isSubmitting}>
              {pageCopy.submitLabel}
            </Button>
            <Link className="button button--secondary" to="/projects">
              Cancel
            </Link>
          </div>
        </form>
      ) : null}
    </section>
  )
}

