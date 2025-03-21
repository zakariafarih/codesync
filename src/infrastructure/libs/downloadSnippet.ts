export function downloadSnippet(snippetName: string, snippetContent: string) {
  const element = document.createElement('a')
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(snippetContent))
  element.setAttribute('download', snippetName)
  
  element.style.display = 'none'
  document.body.appendChild(element)
  
  element.click()
  
  document.body.removeChild(element)
}
