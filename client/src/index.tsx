import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { App } from './App';


// Display the result of the function.
const main: HTMLElement | null = document.getElementById('main');
if (main === null)
  throw new Error("HTML is missing a 'main' element")
const root: Root = createRoot(main);
root.render(<App/>);
