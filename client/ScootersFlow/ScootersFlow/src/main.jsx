import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'     // השורה הזו קריטית
import { store } from './APP/store'       // חיבור לקובץ ה-Store שיצרנו
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>
);