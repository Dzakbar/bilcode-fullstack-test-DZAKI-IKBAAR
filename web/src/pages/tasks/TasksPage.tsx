import { useState, useEffect } from 'react'
import { getTasks, createTask, updateTask, deleteTask, type Task, type TaskFormData } from '../../services/taskService'
import { getProjects } from '../../services/projectService'
import type { Project } from '../../types/project'
import { PageHeader } from '../../components/PageHeader'
import { Modal } from '../../components/Modal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import TaskForm from '../../components/TaskForm'
import { getApiErrorDetails } from '../../utils/apiError'
import { Toast } from '../../components/Toast'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ id: number; message: string; type: 'success' | 'error' } | null>(null)

  // Filters
  const [filterProjectId, setFilterProjectId] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({})

  useEffect(() => {
    fetchTasks()
    fetchProjects()
  }, [filterProjectId, filterStatus])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const params: Record<string, string> = {}
      if (filterProjectId) params.project_id = filterProjectId
      if (filterStatus) params.status = filterStatus
      
      const response = await getTasks(params)
      setTasks(response.data)
    } catch (err) {
      setError('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await getProjects()
      setProjects(response.data)
    } catch (err) {
      console.error('Failed to load projects', err)
    }
  }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ id: Date.now(), message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleCreate = () => {
    setSelectedTask(null)
    setFormErrors({})
    setIsFormOpen(true)
  }

  const handleEdit = (task: Task) => {
    setSelectedTask(task)
    setFormErrors({})
    setIsFormOpen(true)
  }

  const handleDelete = (task: Task) => {
    setSelectedTask(task)
    setIsDeleteOpen(true)
  }

  const onFormSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true)
    setFormErrors({})
    try {
      if (selectedTask) {
        await updateTask(selectedTask.id, data)
        showToast('Task updated successfully')
      } else {
        await createTask(data)
        showToast('Task created successfully')
      }
      setIsFormOpen(false)
      fetchTasks()
    } catch (err: any) {
      const { fieldErrors, message } = getApiErrorDetails(err)
      if (fieldErrors) setFormErrors(fieldErrors)
      else showToast(message || 'An error occurred', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onConfirmDelete = async () => {
    if (!selectedTask) return
    try {
      await deleteTask(selectedTask.id)
      showToast('Task deleted successfully')
      setIsDeleteOpen(false)
      fetchTasks()
    } catch (err: any) {
      const { message } = getApiErrorDetails(err)
      showToast(message || 'Failed to delete task', 'error')
      setIsDeleteOpen(false)
    }
  }

  const statusColors: Record<string, string> = {
    todo: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    review: 'bg-yellow-100 text-yellow-800',
    done: 'bg-green-100 text-green-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-6">
        <PageHeader 
          title="Tasks" 
          description="Manage project tasks"
        />
        <button
          onClick={handleCreate}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          Create Task
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <select 
          value={filterProjectId} 
          onChange={(e) => setFilterProjectId(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
        >
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
        >
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : error ? (
        <div className="text-red-600 text-center py-10">{error}</div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Title</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Project</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Assigned To</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Logged</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Due Date</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{task.title}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {task.project?.name}
                    <div className="text-xs text-gray-400">{task.project?.client?.name}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {task.assignee
                      ? `${task.assignee.name} (${task.assignee.profession ?? 'member'})`
                      : '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {task.total_logged_minutes > 0
                      ? `${Math.round(task.total_logged_minutes / 60)}h ${task.total_logged_minutes % 60}m`
                      : '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[task.status] || statusColors.todo}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{task.deadline || '-'}</td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button onClick={() => handleEdit(task)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                    <button onClick={() => handleDelete(task)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-gray-500">No tasks found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {toast && <Toast toasts={[toast]} onDismiss={() => setToast(null)} />}

      <Modal isOpen={isFormOpen} onClose={() => !isSubmitting && setIsFormOpen(false)} title={selectedTask ? 'Edit Task' : 'Create Task'}>
        <TaskForm
          initialData={selectedTask as TaskFormData}
          onSubmit={onFormSubmit}
          onCancel={() => setIsFormOpen(false)}
          isSubmitting={isSubmitting}
          errors={formErrors}
        />
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Task"
        message={`Are you sure you want to delete "${selectedTask?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={onConfirmDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  )
}
