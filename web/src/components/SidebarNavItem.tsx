import { NavLink } from 'react-router'

interface SidebarNavItemProps {
  label: string
  to: string
  disabled?: boolean
}

export function SidebarNavItem({ disabled = false, label, to }: SidebarNavItemProps) {
  if (disabled) {
    return (
      <span className="sidebar-link sidebar-link--disabled" aria-disabled="true">
        <span>{label}</span>
        <small>Coming next</small>
      </span>
    )
  }

  return (
    <NavLink className="sidebar-link" to={to}>
      {label}
    </NavLink>
  )
}
