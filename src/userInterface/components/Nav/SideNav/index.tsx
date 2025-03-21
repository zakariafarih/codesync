import style from './index.module.scss'
import { NavLinkPersist } from '../../../supports/Persistence'
import WorkspaceIcon from '../../../icons/Workspace.svg'
import EditorIcon from '../../../icons/Editor.svg'

export interface SideNavProps {
  className?: string;
}

export function SideNav({ className }: SideNavProps) {
  return (
    <div className={`${className ?? '' } ${style.container}`}>
      <NavLinkPersist
        to='/editor'
        title='Editor'
        className={({ isActive }) => isActive ? `${style.active} ${style.option}` : `${style.option}`}
      >
        <img src={EditorIcon} alt='Editor' className={style.logo} />
      </NavLinkPersist>
      <NavLinkPersist
        to='/explorer'
        title='Explorer'
        className={({ isActive }) => isActive ? `${style.active} ${style.option}` : `${style.option}`}
      >
        <img src={WorkspaceIcon} alt='Editor' className={style.logo} />
      </NavLinkPersist>
      {/* <NavLinkPersist to='/search' title='Search' className={({ isActive }) => isActive ? `${style.active} ${style.option}` : `${style.option}`}><SearchIcon /></NavLinkPersist> */}
      {/* <NavLinkPersist to='/settings' title='Settings' className={({ isActive }) => isActive ? `${style.active} ${style.option}` : `${style.option}`}><SettingsGearIcon /></NavLinkPersist> */}
    </div>
  )
}
