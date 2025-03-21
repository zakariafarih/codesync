import style from './index.module.scss'

export interface AboutAppWrapperProps {
  className?: string
}

export function AboutAppWrapper({ className }: AboutAppWrapperProps) {
  return (
    <div className={`${className} ${style.container}`}>
      <h1>Welcome to CodeSync</h1>
      
      <section className={style.feature}>
        <h2>Share Code Seamlessly</h2>
        <p>
          CodeSync is your go-to platform for sharing code snippets across devices 
          and team members. Built by developers, for developers.
        </p>
      </section>

      <section className={style.features}>
        <h3>Key Features</h3>
        <ul>
          <li>✨ Real-time code synchronization</li>
          <li>📱 Cross-device compatibility</li>
          <li>🎨 Syntax highlighting</li>
          <li>📂 Organized workspace management</li>
          <li>🔍 Quick search functionality</li>
        </ul>
      </section>

      <section className={style.tech}>
        <h3>Technologies</h3>
        <div className={style.badges}>
          <span className={style.badge}>TypeScript</span>
          <span className={style.badge}>React</span>
          <span className={style.badge}>Monaco Editor</span>
        </div>
      </section>

      <footer className={style.footer}>
        <p>Version 1.0.0</p>
        <p>Made with ❤️ by Zakaria Farih</p>
      </footer>
    </div>
  )
}