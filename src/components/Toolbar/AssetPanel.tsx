import React, { useState } from 'react'
import { 
  Shapes, 
  Image as ImageIcon, 
  Layout, 
  GitBranch, 
  Search, 
  X 
} from 'lucide-react'
import { ASSETS, ASSET_CATEGORIES } from '../../data/assets'
import { useEditorStore } from '../../stores/editor-store'

export default function AssetPanel() {
  const { showAssetPanel, toggleAssetPanel, setActiveTool } = useEditorStore()
  const [activeCategory, setActiveCategory] = useState<string>('basic')
  const [searchQuery, setSearchQuery] = useState('')

  if (!showAssetPanel) return null

  const filteredAssets = ASSETS.filter(asset => 
    asset.category === activeCategory && 
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAssetClick = (asset: any) => {
    // Basic shapes can switch tools for drawing
    if (asset.category === 'basic') {
      setActiveTool(asset.id.replace('basic-', '') as any)
      return
    }

    // Others are stamped/inserted
    window.dispatchEvent(new CustomEvent('canvas:insert-asset', {
      detail: asset
    }))
  }

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'basic': return <Shapes size={16} />
      case 'icons': return <ImageIcon size={16} />
      case 'forms': return <Layout size={16} />
      case 'flowchart': return <GitBranch size={16} />
      default: return <Shapes size={16} />
    }
  }

  return (
    <div className="asset-panel panel fade-in">
      <div className="panel-header">
        <span>元件庫</span>
        <button className="titlebar-btn" onClick={toggleAssetPanel}>
          <X size={14} />
        </button>
      </div>

      <div className="asset-search-container">
        <div className="search-input-wrapper">
          <Search size={14} className="search-icon" />
          <input 
            type="text" 
            placeholder="搜尋元件..." 
            className="prop-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="asset-categories-tabs">
        {ASSET_CATEGORIES.map(cat => (
          <button 
            key={cat.id} 
            className={`asset-category-tab ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
            title={cat.name}
          >
            {getCategoryIcon(cat.id)}
          </button>
        ))}
      </div>

      <div className="asset-grid">
        {filteredAssets.map(asset => (
          <div 
            key={asset.id} 
            className="asset-item" 
            onClick={() => handleAssetClick(asset)}
          >
            <div className="asset-preview">
               {/* Simplified preview based on type */}
               {asset.type === 'rect' && <div className="preview-rect" />}
               {asset.type === 'circle' && <div className="preview-circle" />}
               {asset.type === 'star' && <Shapes size={20} />}
               {asset.type === 'triangle' && <div className="preview-triangle" />}
               {asset.type === 'path' && (
                 <svg viewBox="0 0 100 100" width="24" height="24">
                   <path d={asset.path} fill="none" stroke="currentColor" strokeWidth="4" />
                 </svg>
               )}
               {asset.type === 'group' && <Layout size={20} />}
            </div>
            <span className="asset-name">{asset.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
