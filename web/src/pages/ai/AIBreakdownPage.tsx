import { useState, useRef } from 'react'
import { useNavigate } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { getProjects } from '../../services/projectService'
import { breakdownPRD, saveGeneratedTasks, type GeneratedTask } from '../../services/aiService'
import type { Project } from '../../types/project'

export function AIBreakdownPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [prdText, setPrdText] = useState('')
  const [fileName, setFileName] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([])
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set())
  const [step, setStep] = useState<'input' | 'preview'>('input')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const text = await file.text()
    setPrdText(text)
  }

  const handleGenerate = async () => {
    if (!prdText.trim()) {
      setError('Please enter or upload a PRD document')
      return
    }
    setError('')
    setLoading(true)
    try {
      const tasks = await breakdownPRD(prdText)
      setGeneratedTasks(tasks)
      setSelectedTasks(new Set(tasks.map((_, i) => i)))
      setStep('preview')
      const res = await getProjects()
      setProjects(res.data)
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to generate tasks')
    } finally {
      setLoading(false)
    }
  }

  const toggleTask = (index: number) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedTasks.size === generatedTasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(generatedTasks.map((_, i) => i)))
    }
  }

  const handleSave = async () => {
    if (!selectedProjectId) {
      setError('Please select a project')
      return
    }
    const tasksToSave = generatedTasks.filter((_, i) => selectedTasks.has(i))
    if (tasksToSave.length === 0) {
      setError('Select at least one task to save')
      return
    }
    setError('')
    setSaving(true)
    try {
      await saveGeneratedTasks(Number(selectedProjectId), tasksToSave)
      navigate('/tasks')
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to save tasks')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setStep('input')
    setGeneratedTasks([])
    setSelectedTasks(new Set())
    setSelectedProjectId('')
    setError('')
  }

  const categoryColors: Record<string, string> = {
    frontend: 'bg-blue-100 text-blue-800',
    backend: 'bg-green-100 text-green-800',
    design: 'bg-purple-100 text-purple-800',
    qa: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <section className="page ai-page" aria-labelledby="ai-heading">
      <PageHeader
        eyebrow="AI Assistant"
        title="AI Task Breakdown"
        description="Upload a PRD document and let AI break it into tasks"
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      {step === 'input' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-3xl">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload PRD Document (.txt)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {fileName && (
              <p className="mt-1 text-xs text-gray-500">File: {fileName}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or paste PRD text directly
            </label>
            <textarea
              value={prdText}
              onChange={(e) => setPrdText(e.target.value)}
              rows={12}
              placeholder="Paste your PRD content here..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-3"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prdText.trim()}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating with AI...' : 'Generate Tasks'}
          </button>
        </div>
      )}

      {step === 'preview' && generatedTasks.length > 0 && (
        <div className="space-y-4 max-w-4xl">
          <div className="flex items-center gap-4">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <button
              onClick={handleSave}
              disabled={saving || !selectedProjectId || selectedTasks.size === 0}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : `Save Selected (${selectedTasks.size})`}
            </button>

            <button
              onClick={handleReset}
              disabled={saving}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Back
            </button>
          </div>

          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    <input
                      type="checkbox"
                      checked={selectedTasks.size === generatedTasks.length}
                      onChange={toggleAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Title</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Est. Effort</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {generatedTasks.map((task, i) => (
                  <tr key={i}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(i)}
                        onChange={() => toggleTask(i)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900">
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-gray-500 mt-1">{task.description}</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[task.category] || 'bg-gray-100 text-gray-800'}`}>
                        {task.category}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {task.estimated_effort}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
