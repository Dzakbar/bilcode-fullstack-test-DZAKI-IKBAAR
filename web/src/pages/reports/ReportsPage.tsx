import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { LoadingState } from '../../components/LoadingState'
import { EmptyState } from '../../components/EmptyState'
import { getWorkHours, getReportProjects, getMembers, exportCsv, type WorkHoursReport, type ReportProject, type MemberOption } from '../../services/reportService'
import { getApiErrorDetails } from '../../utils/apiError'
import { useAuth } from '../../auth/AuthContext'
import { useNavigate } from 'react-router'

export function ReportsPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [report, setReport] = useState<WorkHoursReport | null>(null)
  const [projects, setProjects] = useState<ReportProject[]>([])
  const [members, setMembers] = useState<MemberOption[]>([])
  const [projectId, setProjectId] = useState('')
  const [memberId, setMemberId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isFiltering, setIsFiltering] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const [reportData, projectsData, membersData] = await Promise.all([
          getWorkHours(),
          getReportProjects(),
          getMembers(),
        ])

        if (!mounted) return

        setReport(reportData)
        setProjects(projectsData)
        setMembers(membersData)
      } catch (err) {
        if (!mounted) return

        const details = getApiErrorDetails(err)

        if (details.status === 401) {
          await logout()
          navigate('/login', { replace: true })
          return
        }

        setError(details.message)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [logout, navigate])

  const handleFilter = async () => {
    setIsFiltering(true)
    setError(null)

    try {
      const params: Record<string, string> = {}

      if (projectId) params.project_id = projectId
      if (memberId) params.member_id = memberId
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo

      const data = await getWorkHours(params)
      setReport(data)
    } catch (err) {
      const details = getApiErrorDetails(err)

      if (details.status === 401) {
        await logout()
        navigate('/login', { replace: true })
        return
      }

      setError(details.message)
    } finally {
      setIsFiltering(false)
    }
  }

  const handleReset = async () => {
    setProjectId('')
    setMemberId('')
    setDateFrom('')
    setDateTo('')
    setIsFiltering(true)

    try {
      const data = await getWorkHours()
      setReport(data)
    } catch (err) {
      const details = getApiErrorDetails(err)

      if (details.status === 401) {
        await logout()
        navigate('/login', { replace: true })
        return
      }

      setError(details.message)
    } finally {
      setIsFiltering(false)
    }
  }

  const handleExportCsv = async () => {
    setIsExporting(true)
    try {
      const params: Record<string, string> = {}
      if (projectId) params.project_id = projectId
      if (memberId) params.member_id = memberId
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      await exportCsv(params)
    } catch (err) {
      const details = getApiErrorDetails(err)
      if (details.status === 401) {
        await logout()
        navigate('/login', { replace: true })
        return
      }
      setError(details.message)
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) return <section className="page"><PageHeader eyebrow="Reports" title="Work Hours Report" /><LoadingState label="Loading report data" /></section>

  return (
    <section className="page" aria-labelledby="reports-heading">
      <PageHeader
        eyebrow="Reports"
        title="Work Hours Report"
        description="View and export work hours logged by team members across projects."
      />

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 rounded-lg border border-neutral-200 bg-white p-4 sm:grid-cols-5">
        <div className="flex flex-col gap-1">
          <label htmlFor="project" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Project</label>
          <select
            id="project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950"
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="member" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Member</label>
          <select
            id="member"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950"
          >
            <option value="">All members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}{m.profession ? ` (${m.profession})` : ''}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="date_from" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Date From</label>
          <input
            id="date_from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="date_to" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Date To</label>
          <input
            id="date_to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={handleFilter}
            disabled={isFiltering}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-950 bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
          >
            {isFiltering ? 'Filtering...' : 'Filter'}
          </button>
          <button
            onClick={handleReset}
            disabled={isFiltering}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100"
          >
            Reset
          </button>
        </div>
      </div>

      {report && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Total Logs</p>
              <p className="mt-1 text-2xl font-semibold text-neutral-950">{report.summary.total_logs}</p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Total Minutes</p>
              <p className="mt-1 text-2xl font-semibold text-neutral-950">{report.summary.total_minutes}</p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Total Hours</p>
              <p className="mt-1 text-2xl font-semibold text-neutral-950">{report.summary.total_hours}</p>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-neutral-500">
              {report.rows.length > 0 ? `${report.rows.length} records` : 'No records'}
            </p>
            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-950 bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
            >
              {isExporting ? 'Downloading...' : 'Export CSV'}
            </button>
          </div>

          {report.rows.length === 0 ? (
            <EmptyState title="No records" description="No work hours match the selected filters." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50 text-xs font-bold uppercase tracking-wider text-neutral-500">
                      <th className="px-5 py-3" scope="col">Date</th>
                      <th className="px-5 py-3" scope="col">Member</th>
                      <th className="px-5 py-3" scope="col">Project</th>
                      <th className="px-5 py-3" scope="col">Task</th>
                      <th className="px-5 py-3 text-right" scope="col">Hours</th>
                      <th className="px-5 py-3" scope="col">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((row) => (
                      <tr className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50" key={row.id}>
                        <td className="whitespace-nowrap px-5 py-4 text-neutral-700">{row.work_date}</td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="font-medium text-neutral-950">{row.member_name}</div>
                          {row.member_profession ? (
                            <div className="text-xs text-neutral-500">{row.member_profession}</div>
                          ) : null}
                        </td>
                        <td className="px-5 py-4 text-neutral-700">{row.project_name}</td>
                        <td className="px-5 py-4 text-neutral-700">{row.task_title}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-neutral-950">{row.duration_hours}</td>
                        <td className="max-w-xs truncate px-5 py-4 text-neutral-500">{row.note ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
