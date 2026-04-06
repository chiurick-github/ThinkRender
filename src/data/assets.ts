export interface SVGAsset {
  id: string
  name: string
  category: 'basic' | 'icons' | 'forms' | 'flowchart'
  path?: string // For simple paths
  type: 'rect' | 'circle' | 'triangle' | 'star' | 'path' | 'group'
  data?: any // For complex structures or groups
}

export const ASSET_CATEGORIES = [
  { id: 'basic', name: '基本圖形' },
  { id: 'icons', name: '圖示' },
  { id: 'forms', name: '表單組件' },
  { id: 'flowchart', name: '流程圖' }
]

export const ASSETS: SVGAsset[] = [
  // Basic Shapes
  { id: 'basic-rect', name: 'Rectangle', category: 'basic', type: 'rect' },
  { id: 'basic-circle', name: 'Circle', category: 'basic', type: 'circle' },
  { id: 'basic-triangle', name: 'Triangle', category: 'basic', type: 'triangle' },
  { id: 'basic-star', name: 'Star', category: 'basic', type: 'star' },

  // Flowchart
  { 
    id: 'flow-decision', 
    name: 'Decision', 
    category: 'flowchart', 
    type: 'path', 
    path: 'M 50 0 L 100 50 L 50 100 L 0 50 Z' // Diamond
  },
  { 
    id: 'flow-process', 
    name: 'Process', 
    category: 'flowchart', 
    type: 'rect' 
  },
  { 
    id: 'flow-terminator', 
    name: 'Start/End', 
    category: 'flowchart', 
    type: 'path', 
    path: 'M 20 0 L 80 0 A 20 20 0 0 1 80 40 L 20 40 A 20 20 0 0 1 20 0 Z' // Pill
  },

  // Icons (Subset of simple UI icons)
  { 
    id: 'icon-search', 
    name: 'Search', 
    category: 'icons', 
    type: 'path', 
    path: 'M 11 19 A 8 8 0 1 0 11 3 A 8 8 0 0 0 11 19 Z M 21 21 L 16.65 16.65' 
  },
  { 
    id: 'icon-user', 
    name: 'User', 
    category: 'icons', 
    type: 'path', 
    path: 'M 20 21 v -2 a 4 4 0 0 0 -4 -4 H 8 a 4 4 0 0 0 -4 4 v 2 M 12 11 a 4 4 0 1 0 0 -8 a 4 4 0 0 0 0 8 z' 
  },
  { 
    id: 'icon-trash', 
    name: 'Trash', 
    category: 'icons', 
    type: 'path', 
    path: 'M 3 6 h 18 M 19 6 v 14 a 2 2 0 0 1 -2 2 H 7 a 2 2 0 0 1 -2 -2 V 6 m 3 0 V 4 a 2 2 0 0 1 2 -2 h 4 a 2 2 0 0 1 2 2 v 2' 
  },

  // Forms
  {
    id: 'form-input',
    name: 'Input Box',
    category: 'forms',
    type: 'group',
    data: {
      objects: [
        { type: 'rect', top: 0, left: 0, width: 200, height: 40, fill: '#ffffff', stroke: '#cbd6f4', strokeWidth: 1, rx: 4, ry: 4 },
        { type: 'text', top: 12, left: 12, text: 'Input placeholder...', fontSize: 14, fill: '#6c7086' }
      ]
    }
  },
  {
    id: 'form-checkbox',
    name: 'Checkbox',
    category: 'forms',
    type: 'group',
    data: {
      objects: [
        { type: 'rect', top: 0, left: 0, width: 20, height: 20, fill: '#ffffff', stroke: '#cbd6f4', strokeWidth: 1, rx: 4, ry: 4 },
        { type: 'text', top: 2, left: 28, text: 'Label', fontSize: 14, fill: '#cdd6f4' }
      ]
    }
  }
]
