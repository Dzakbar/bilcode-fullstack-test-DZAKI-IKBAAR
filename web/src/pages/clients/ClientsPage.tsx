import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../auth/AuthContext'
import { ClientForm } from '../../components/ClientForm'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Modal } from '../../components/Modal'
import { Toast, type ToastMessage, type ToastType } from '../../components/Toast'
import { createClient, deleteClient, getClients, updateClient } from '../../services/clientService'
import type { Client, ClientFormData } from '../../types/client'
import { getApiErrorDetails } from '../../utils/apiError'

type ClientFieldErrors = Partial<Record<keyof ClientFormData, string>>
type ModalMode = 'create' | 'edit'

const emptyForm: ClientFormData = {
  name: '',
  email: '',
  company: '',
}

function firstFieldError(errors: Record<string, string[]> | undefined, field: keyof ClientFormData): string | undefined {
  return errors?.[field]?.[0]
}

function clientToFormData(client: Client): ClientFormData {
  return {
    name: client.name,
    email: client.email,
    company: client.company ?? '',
  }
}

export function ClientsPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('create')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [formData, setFormData] = useState<ClientFormData>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<ClientFieldErrors>({})
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const formTitle = modalMode === 'create' ? 'Create client' : 'Edit client'
  const formDescription =
    modalMode === 'create' ? 'Add a new client record to ProjectPulse.' : 'Update this client record.'
  const submitLabel = modalMode === 'create' ? 'Create Client' : 'Save Changes'

  const hasClients = clients.length > 0

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

  const loadClients = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await getClients()
      setClients(response.data)
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
    void loadClients()
  }, [loadClients])

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedClient(null)
    setFormData(emptyForm)
    setFieldErrors({})
    setIsFormOpen(true)
  }

  const openEditModal = (client: Client) => {
    setModalMode('edit')
    setSelectedClient(client)
    setFormData(clientToFormData(client))
    setFieldErrors({})
    setIsFormOpen(true)
  }

  const closeFormModal = () => {
    if (isSubmitting) {
      return
    }

    setIsFormOpen(false)
    setSelectedClient(null)
    setFieldErrors({})
    setFormData(emptyForm)
  }

  const validate = () => {
    const nextErrors: ClientFieldErrors = {}

    if (!formData.name.trim()) {
      nextErrors.name = 'Name is required.'
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required.'
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
      if (modalMode === 'edit' && selectedClient) {
        const updatedClient = await updateClient(selectedClient.id, formData)
        setClients((current) => current.map((client) => (client.id === updatedClient.id ? updatedClient : client)))
        addToast('success', 'Client updated successfully.')
      } else {
        const createdClient = await createClient(formData)
        setClients((current) => [createdClient, ...current])
        addToast('success', 'Client created successfully.')
      }

      closeFormModal()
    } catch (error) {
      const details = getApiErrorDetails(error)

      if (await handleAuthError(details.status)) {
        return
      }

      setFieldErrors({
        name: firstFieldError(details.fieldErrors, 'name'),
        email: firstFieldError(details.fieldErrors, 'email'),
        company: firstFieldError(details.fieldErrors, 'company'),
      })
      addToast('error', details.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!clientToDelete) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteClient(clientToDelete.id)
      setClients((current) => current.filter((client) => client.id !== clientToDelete.id))
      setClientToDelete(null)
      addToast('success', 'Client deleted successfully.')
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
      clients.map((client) => (
        <tr className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50" key={client.id}>
          <td className="px-5 py-4">
            <div className="font-semibold text-neutral-950">{client.name}</div>
          </td>
          <td className="px-5 py-4 text-neutral-700">{client.email}</td>
          <td className="px-5 py-4 text-neutral-700">{client.company || '-'}</td>
          <td className="px-5 py-4">
            <div className="flex justify-end gap-2">
              <button
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100"
                type="button"
                onClick={() => openEditModal(client)}
              >
                Edit
              </button>
              <button
                className="rounded-lg px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950"
                type="button"
                onClick={() => setClientToDelete(client)}
              >
                Delete
              </button>
            </div>
          </td>
        </tr>
      )),
    [clients],
  )

  return (
    <section className="mx-auto grid max-w-6xl gap-6" aria-labelledby="clients-heading">
      <Toast toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-wider text-neutral-500">Clients</p>
          <h1 id="clients-heading" className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
            Client management
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            Manage client records, contact emails, and company details in one clean workspace.
          </p>
        </div>
        <button
          className="inline-flex h-11 items-center justify-center rounded-lg border border-neutral-950 bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
          type="button"
          onClick={openCreateModal}
        >
          Create Client
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div>
            <h2 className="m-0 text-base font-semibold text-neutral-950">Clients</h2>
            <p className="mt-1 text-sm text-neutral-500">{isLoading ? 'Loading records...' : `${clients.length} records`}</p>
          </div>
          <button
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={isLoading}
            onClick={() => void loadClients()}
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

        {!isLoading && !hasClients ? (
          <div className="grid min-h-72 place-items-center px-6 py-12 text-center">
            <div>
              <h2 className="text-xl font-semibold text-neutral-950">No clients yet</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-600">
                Create your first client record to start organizing project work.
              </p>
              <button
                className="mt-5 inline-flex h-11 items-center justify-center rounded-lg border border-neutral-950 bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
                type="button"
                onClick={openCreateModal}
              >
                Create Client
              </button>
            </div>
          </div>
        ) : null}

        {!isLoading && hasClients ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-xs font-bold uppercase tracking-wider text-neutral-500">
                  <th className="px-5 py-3" scope="col">
                    Name
                  </th>
                  <th className="px-5 py-3" scope="col">
                    Email
                  </th>
                  <th className="px-5 py-3" scope="col">
                    Company
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
        <ClientForm
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
        isOpen={Boolean(clientToDelete)}
        title="Delete client"
        message="Are you sure you want to delete this client? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setClientToDelete(null)
          }
        }}
        onConfirm={() => void handleDelete()}
      />
    </section>
  )
}
