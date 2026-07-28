import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useAuth } from '../../auth/AuthContext'
import { Alert } from '../../components/Alert'
import { ApiErrorState } from '../../components/ApiErrorState'
import { ClientForm } from '../../components/ClientForm'
import { LoadingState } from '../../components/LoadingState'
import { PageHeader } from '../../components/PageHeader'
import { createClient, getClient, updateClient } from '../../services/clientService'
import type { ClientFormData } from '../../types/client'
import { getApiErrorDetails } from '../../utils/apiError'

type FieldErrors = Partial<Record<keyof ClientFormData, string>>

const emptyForm: ClientFormData = {
  name: '',
  email: '',
  company: '',
}

function firstFieldError(errors: Record<string, string[]> | undefined, field: keyof ClientFormData): string | undefined {
  return errors?.[field]?.[0]
}

export function ClientFormPage() {
  const { id } = useParams()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)
  const [formData, setFormData] = useState<ClientFormData>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(isEditMode)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const pageCopy = useMemo(
    () => ({
      title: isEditMode ? 'Edit client' : 'Create client',
      description: isEditMode ? 'Update the client details stored in ProjectPulse.' : 'Add a client record for future project work.',
      submitLabel: isEditMode ? 'Save Changes' : 'Create Client',
    }),
    [isEditMode],
  )

  useEffect(() => {
    if (!id) {
      return
    }

    let isMounted = true

    async function loadClient() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const client = await getClient(id as string)

        if (!isMounted) {
          return
        }

        setFormData({
          name: client.name,
          email: client.email,
          company: client.company ?? '',
        })
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

    void loadClient()

    return () => {
      isMounted = false
    }
  }, [id, logout, navigate])

  const validate = () => {
    const nextErrors: FieldErrors = {}

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
    setFormError(null)

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditMode && id) {
        await updateClient(id, formData)
      } else {
        await createClient(formData)
      }

      navigate('/clients', {
        state: {
          successMessage: isEditMode ? 'Client updated successfully.' : 'Client created successfully.',
        },
      })
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
        email: firstFieldError(details.fieldErrors, 'email'),
        company: firstFieldError(details.fieldErrors, 'company'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="page client-form-page" aria-labelledby="client-form-heading">
      <PageHeader eyebrow="Clients" title={pageCopy.title} description={pageCopy.description} />

      {isLoading ? <LoadingState label="Loading client" /> : null}

      {!isLoading && loadError ? <ApiErrorState message={loadError} /> : null}

      {!isLoading && !loadError ? (
        <>
          {formError ? <Alert title="Unable to save client">{formError}</Alert> : null}
          <ClientForm
            data={formData}
            errors={fieldErrors}
            isSubmitting={isSubmitting}
            submitLabel={pageCopy.submitLabel}
            onCancel={() => navigate('/clients')}
            onChange={(field, value) => {
              setFormData((current) => ({ ...current, [field]: value }))
              setFieldErrors((current) => ({ ...current, [field]: undefined }))
            }}
            onSubmit={(event) => void handleSubmit(event)}
          />
        </>
      ) : null}
    </section>
  )
}
