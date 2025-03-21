import { SideNav, BottomNav } from './components/Nav'
import style from './App.module.scss'
import { Route, Routes } from 'react-router-dom'
import { EditorPage } from './pages/editor'
import { ExplorerPage } from './pages/explorer'
import { AboutAppWrapper } from './components/AboutAppWrapper'
import 'antd/dist/reset.css'
import { useWindowSize } from 'react-use'
import { antdThemeConfig } from './theme/antdThemeConfig'
import { ConfigProvider } from 'antd'

function App() {
  const { width } = useWindowSize()
  const isWideScreen = width > 600

  return (
    <ConfigProvider theme={antdThemeConfig}>
      <div className={style.container}>
        {isWideScreen && <SideNav className={style.sideNav} />}
        <main className={style.main}>
          <Routes>
            <Route path='/' element={<AboutAppWrapper />} />
            <Route path='/editor' element={<EditorPage />} />
            <Route path='/editor/:parentId/:folderId' element={<EditorPage />} />
            <Route path='/editor/:parentId/:folderId/:fileId' element={<EditorPage />} />
            <Route path='/explorer/' element={<ExplorerPage />} />
            <Route path='/explorer/:parentId/:folderId' element={<ExplorerPage />} />
          </Routes>
        </main>
        {!isWideScreen && <BottomNav className={style.bottomNav} />}
      </div>
    </ConfigProvider>
  )
}

export default App