
import React, { useState, useRef } from 'react';
import { File, Folder, FolderOpen, ChevronDown, ChevronRight, Plus, Search, X } from 'lucide-react';
import { useFileSystem, FileSystemItem, FileType } from '@/contexts/FileSystemContext';
import { useEditor } from '@/contexts/EditorContext';
import { Menu, Item, useContextMenu } from 'react-contexify';
import 'react-contexify/ReactContexify.css';

const CONTEXT_MENU_ID = 'file-explorer-context-menu';
const FILE_ITEM_MENU_ID = 'file-item-context-menu';
const FOLDER_ITEM_MENU_ID = 'folder-item-context-menu';

const FileExplorer: React.FC = () => {
  const { files, createFile, renameFile, deleteFile, toggleFolder } = useFileSystem();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FileSystemItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newItemType, setNewItemType] = useState<FileType | null>(null);
  const [newItemParentPath, setNewItemParentPath] = useState<string>('');
  const [renamingItemId, setRenamingItemId] = useState<string | null>(null);
  const newItemInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  
  const { show } = useContextMenu();

  // Handle file explorer background context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    show({ event: e, id: CONTEXT_MENU_ID });
  };

  // Handle file/folder item context menu
  const handleItemContextMenu = (e: React.MouseEvent, item: FileSystemItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (item.type === 'file') {
      show({ event: e, id: FILE_ITEM_MENU_ID, props: { itemId: item.id, itemPath: item.path } });
    } else {
      show({ event: e, id: FOLDER_ITEM_MENU_ID, props: { itemId: item.id, itemPath: item.path } });
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    // Simple search implementation
    const results: FileSystemItem[] = [];
    
    const searchInItems = (items: FileSystemItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        
        if (item.type === 'folder' && item.children) {
          searchInItems(item.children);
        }
      }
    };
    
    searchInItems(files);
    setSearchResults(results);
  };

  // Create new file or folder
  const startCreatingNewItem = (parentPath: string, type: FileType) => {
    setNewItemType(type);
    setNewItemParentPath(parentPath);
    
    // Focus the input after it's rendered
    setTimeout(() => {
      if (newItemInputRef.current) {
        newItemInputRef.current.focus();
      }
    }, 50);
  };

  // Handle new item creation
  const handleCreateNewItem = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newItemType) {
      const name = e.currentTarget.value.trim();
      
      if (name) {
        createFile(newItemParentPath, name, newItemType);
        setNewItemType(null);
      }
    } else if (e.key === 'Escape') {
      setNewItemType(null);
    }
  };

  // Start renaming a file or folder
  const startRenaming = (itemId: string) => {
    setRenamingItemId(itemId);
    
    // Focus the input after it's rendered
    setTimeout(() => {
      if (renameInputRef.current) {
        renameInputRef.current.focus();
        renameInputRef.current.select();
      }
    }, 50);
  };

  // Handle rename
  const handleRename = (e: React.KeyboardEvent<HTMLInputElement>, itemId: string) => {
    if (e.key === 'Enter') {
      const newName = e.currentTarget.value.trim();
      
      if (newName) {
        renameFile(itemId, newName);
        setRenamingItemId(null);
      }
    } else if (e.key === 'Escape') {
      setRenamingItemId(null);
    }
  };

  // Recursive component to render the file tree
  const renderFileTree = (items: FileSystemItem[], depth = 0) => {
    return items.map(item => (
      <FileExplorerItem 
        key={item.id}
        item={item}
        depth={depth}
        handleItemContextMenu={handleItemContextMenu}
        renamingItemId={renamingItemId}
        renameInputRef={renameInputRef}
        handleRename={handleRename}
        newItemType={newItemType}
        newItemParentPath={newItemParentPath}
        newItemInputRef={newItemInputRef}
        handleCreateNewItem={handleCreateNewItem}
        setRenamingItemId={setRenamingItemId}
      />
    ));
  };

  return (
    <div 
      className="h-full overflow-auto bg-sidebar flex flex-col"
      onContextMenu={handleContextMenu}
    >
      {/* Explorer Header */}
      <div className="px-2 py-1 flex justify-between items-center border-b border-border">
        <h2 className="text-sm font-medium text-sidebar-foreground">EXPLORER</h2>
        <div className="flex space-x-1">
          <button 
            className="p-1 text-slate-400 hover:text-white hover:bg-sidebar-foreground hover:bg-opacity-10 rounded transition-colors"
            onClick={() => setIsSearching(!isSearching)}
          >
            <Search size={16} />
          </button>
          <button 
            className="p-1 text-slate-400 hover:text-white hover:bg-sidebar-foreground hover:bg-opacity-10 rounded transition-colors"
            onClick={() => startCreatingNewItem(files[0].path, 'file')}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      
      {/* Search Bar */}
      {isSearching && (
        <div className="px-2 py-2 border-b border-border">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-sidebar-foreground bg-opacity-10 text-sm px-3 py-1 rounded text-sidebar-foreground outline-none"
              placeholder="Search files..."
              autoFocus
            />
            {searchQuery && (
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                onClick={() => {
                  setSearchQuery('');
                  handleSearch('');
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* File Tree */}
      <div className="flex-1 overflow-auto">
        {isSearching ? (
          <div className="px-2 py-1">
            {searchResults.length > 0 ? (
              searchResults.map(item => (
                <SearchResultItem 
                  key={item.id} 
                  item={item} 
                  handleItemContextMenu={handleItemContextMenu}
                />
              ))
            ) : (
              <div className="text-sm text-slate-400 px-2 py-1">
                No results found
              </div>
            )}
          </div>
        ) : (
          <div className="px-2 py-1">
            {renderFileTree(files)}
          </div>
        )}
      </div>
      
      {/* Context Menus */}
      <Menu id={CONTEXT_MENU_ID}>
        <Item onClick={() => startCreatingNewItem(files[0].path, 'file')}>
          New File
        </Item>
        <Item onClick={() => startCreatingNewItem(files[0].path, 'folder')}>
          New Folder
        </Item>
      </Menu>
      
      <Menu id={FILE_ITEM_MENU_ID}>
        <Item onClick={({ props }) => startRenaming(props.itemId)}>
          Rename
        </Item>
        <Item onClick={({ props }) => deleteFile(props.itemId)}>
          Delete
        </Item>
      </Menu>
      
      <Menu id={FOLDER_ITEM_MENU_ID}>
        <Item onClick={({ props }) => startCreatingNewItem(props.itemPath, 'file')}>
          New File
        </Item>
        <Item onClick={({ props }) => startCreatingNewItem(props.itemPath, 'folder')}>
          New Folder
        </Item>
        <Item onClick={({ props }) => startRenaming(props.itemId)}>
          Rename
        </Item>
        <Item onClick={({ props }) => deleteFile(props.itemId)}>
          Delete
        </Item>
      </Menu>
    </div>
  );
};

// File Explorer Item Component
interface FileExplorerItemProps {
  item: FileSystemItem;
  depth: number;
  handleItemContextMenu: (e: React.MouseEvent, item: FileSystemItem) => void;
  renamingItemId: string | null;
  renameInputRef: React.RefObject<HTMLInputElement>;
  handleRename: (e: React.KeyboardEvent<HTMLInputElement>, itemId: string) => void;
  newItemType: FileType | null;
  newItemParentPath: string;
  newItemInputRef: React.RefObject<HTMLInputElement>;
  handleCreateNewItem: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  setRenamingItemId: React.Dispatch<React.SetStateAction<string | null>>;
}

const FileExplorerItem: React.FC<FileExplorerItemProps> = ({ 
  item, 
  depth,
  handleItemContextMenu,
  renamingItemId,
  renameInputRef,
  handleRename,
  newItemType,
  newItemParentPath,
  newItemInputRef,
  handleCreateNewItem,
  setRenamingItemId
}) => {
  const { toggleFolder, selectedFile } = useFileSystem();
  const { openTab } = useEditor();
  
  // Handle item click
  const handleItemClick = () => {
    if (item.type === 'folder') {
      toggleFolder(item.id);
    } else {
      openTab(item.id);
    }
  };
  
  const isSelected = selectedFile === item.id;
  const showNewItemInput = newItemType && newItemParentPath === item.path;
  
  return (
    <div>
      {/* File/Folder Item */}
      <div
        className={`file-explorer-item flex items-center py-0.5 px-1 cursor-pointer rounded ${
          isSelected ? 'bg-sidebar-foreground bg-opacity-20' : ''
        }`}
        style={{ paddingLeft: `${(depth * 12) + 4}px` }}
        onClick={handleItemClick}
        onContextMenu={(e) => handleItemContextMenu(e, item)}
      >
        {item.type === 'folder' && (
          <span className="mr-1 text-slate-400">
            {item.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        
        <span className="mr-1 text-slate-400">
          {item.type === 'folder' 
            ? (item.isOpen ? <FolderOpen size={16} /> : <Folder size={16} />)
            : <File size={16} />
          }
        </span>
        
        {renamingItemId === item.id ? (
          <input
            type="text"
            defaultValue={item.name}
            ref={renameInputRef}
            className="bg-sidebar-foreground bg-opacity-20 text-sm px-1 rounded text-sidebar-foreground outline-none"
            onKeyDown={(e) => handleRename(e, item.id)}
            onBlur={() => setTimeout(() => setRenamingItemId(null), 100)}
          />
        ) : (
          <span className="text-sm text-sidebar-foreground opacity-90 truncate">{item.name}</span>
        )}
      </div>
      
      {/* New Item Input (if this folder is selected for a new item) */}
      {showNewItemInput && (
        <div 
          className="flex items-center py-0.5 px-1"
          style={{ paddingLeft: `${((depth + 1) * 12) + 4}px` }}
        >
          <span className="mr-1 text-slate-400">
            {newItemType === 'folder' ? <Folder size={16} /> : <File size={16} />}
          </span>
          <input
            type="text"
            ref={newItemInputRef}
            className="bg-sidebar-foreground bg-opacity-20 text-sm px-1 rounded text-sidebar-foreground outline-none"
            onKeyDown={handleCreateNewItem}
            placeholder={`New ${newItemType}`}
          />
        </div>
      )}
      
      {/* Render children if folder is open */}
      {item.type === 'folder' && item.isOpen && item.children && (
        <div>
          {item.children.map(child => (
            <FileExplorerItem
              key={child.id}
              item={child}
              depth={depth + 1}
              handleItemContextMenu={handleItemContextMenu}
              renamingItemId={renamingItemId}
              renameInputRef={renameInputRef}
              handleRename={handleRename}
              newItemType={newItemType}
              newItemParentPath={newItemParentPath}
              newItemInputRef={newItemInputRef}
              handleCreateNewItem={handleCreateNewItem}
              setRenamingItemId={setRenamingItemId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Search Result Item Component
interface SearchResultItemProps {
  item: FileSystemItem;
  handleItemContextMenu: (e: React.MouseEvent, item: FileSystemItem) => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ item, handleItemContextMenu }) => {
  const { openTab } = useEditor();
  
  const handleClick = () => {
    if (item.type === 'file') {
      openTab(item.id);
    }
  };
  
  return (
    <div
      className="file-explorer-item flex items-center py-0.5 px-2 cursor-pointer rounded hover:bg-sidebar-foreground hover:bg-opacity-10 transition-colors"
      onClick={handleClick}
      onContextMenu={(e) => handleItemContextMenu(e, item)}
    >
      <span className="mr-2 text-slate-400">
        {item.type === 'folder' ? <Folder size={16} /> : <File size={16} />}
      </span>
      <span className="text-sm text-sidebar-foreground opacity-90 truncate">{item.name}</span>
      <span className="text-xs text-slate-500 ml-2 truncate opacity-70">{item.path}</span>
    </div>
  );
};

export default FileExplorer;
