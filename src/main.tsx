<<<<<<< HEAD
import React from 'react';
import ReactDOM from 'react-dom/client';
import  App  from './App';
//import './index.css';
import { Toaster } from 'sonner';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Toaster richColors position="top-right" />
    <App />
  </React.StrictMode>
);
=======
import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// @ts-ignore
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
>>>>>>> temp-branch
