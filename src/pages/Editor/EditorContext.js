import { createContext, useContext } from 'react';

const EditorContext = createContext({
  toggleBreakpoint: () => {},
  isRunning: false,
});

export function useEditorContext() {
  return useContext(EditorContext);
}

export default EditorContext;
