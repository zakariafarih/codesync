import { SubNav } from '../Nav/SubNav'
import style from './index.module.scss'

interface AppSectionProps {
  children: React.ReactNode[]
  title: string
}

export function AppSection({ children, title }: AppSectionProps) {
  const subnavChild = children[0]
  const mainChild = children[1]
  return (
    <div className={style.appSection}>
      <SubNav title={title}>{subnavChild}</SubNav>
      {mainChild}
    </div>
  )
}