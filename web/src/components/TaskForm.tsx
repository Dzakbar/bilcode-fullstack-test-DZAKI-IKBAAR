import { useState, useEffect } from 'react'
import { getProjects } from '../services/projectService'
import { getMembers } from '../services/userService'
import type { Project } from '../types/project'
import type { Member } from '../types/member'
import type { TaskFormData } from '../services/taskService'

type TaskFormProps = {
  initialData?: TaskFormData
  onSubmit: (data: TaskFormData) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
  errors?: Record<string, string[]>
}

export default function TaskForm({ initialData, onSubmit, onCancel, isSubmitting, errors = {} }: TaskFormProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [members, setMembers] = useState<Member[]>([])
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    project_id: initialData?.project_id || '',
    assignee_id: initialData?.assignee_id || '',
    category: initialData?.category || 'frontend',
    status: initialData?.status || 'todo',
    deadline: initialData?.deadline || '',
  })

  useEffect(() => {
    getProjects().then((res: any) => setProjects(res.data)).catch(console.error)
    getMembers().then((res: any) => setMembers(res.data)).catch(console.error)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: TaskFormData) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title[0]}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Project</label>
        <select
          name="project_id"
          value={formData.project_id}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
        >
          <option value="">Select a project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.client ? `(${p.client.name})` : ''}
            </option>
          ))}
        </select>
        {errors.project_id && <p className="mt-1 text-sm text-red-600">{errors.project_id[0]}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Assign To</label>
        <select
          name="assignee_id"
          value={formData.assignee_id || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
        >
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.profession})
            </option>
          ))}
        </select>
        {errors.assignee_id && <p className="mt-1 text-sm text-red-600">{errors.assignee_id[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status[0]}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          >
            <option value="frontend">Frontend</option>
            <option value="backend">Backend</option>
            <option value="design">Design</option>
            <option value="qa">QA</option>
          </select>
          {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category[0]}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Due Date</label>
        <input
          type="date"
          name="deadline"
          value={formData.deadline}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
        />
        {errors.deadline && <p className="mt-1 text-sm text-red-600">{errors.deadline[0]}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description[0]}</p>}
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Task'}
        </button>
      </div>
    </form>
  )
}
