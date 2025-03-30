
import React, { useState } from 'react';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { ChevronDown, ChevronRight, Folder, FolderOpen, Plus, MoreVertical, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEditor } from '@/contexts/EditorContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getFileIconName, getFileTypeColor } from '@/utils/languageUtils';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import '../../styles/contextMenu.css';
import * as Icons from 'lucide-react';

// Import FileSystemItem type from FileSystemContext
import { FileSystemItem } from '@/contexts/FileSystemContext';

const FileExplorer: React.FC = () => {
  const { 
    files, 
    selectedFile,
    createFile, 
    renameFile, 
    deleteFile,
    toggleFolder,
    searchFiles
  } = useFileSystem();
  
  const { openTab } = useEditor();
  const [searchQuery, setSearchQuery] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'file' | 'folder' | null>(null);
  const [newItemParentPath, setNewItemParentPath] = useState('');
  const [renamingItem, setRenamingItem] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const { toast } = useToast();
  
  const renderItem = (item: FileSystemItem) => {
    const isRenaming = renamingItem === item.id;
    const isCreatingInFolder = newItemParentPath === item.path && newItemType !== null;
    
    const getIcon = () => {
      if (item.type === 'folder') {
        return item.isOpen ? <FolderOpen size={16} className="shrink-0" /> : <Folder size={16} className="shrink-0" />;
      }
      
      const iconName = getFileIconName(item.name);
      const IconComponent = (Icons as any)[iconName] || File;
      
      const color = getFileTypeColor(item.name);
      
      return <IconComponent size={16} className="shrink-0" style={{ color }} />;
    };
    
    return (
      <div key={item.id} className="select-none">
        <div
          className={cn(
            "flex items-center py-1 px-2 hover:bg-secondary/20 rounded-sm cursor-pointer relative group",
            selectedFile === item.id && "bg-secondary/40"
          )}
          onClick={() => {
            if (item.type === 'folder') {
              toggleFolder(item.id);
            } else {
              openTab(item.id);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
          }}
        >
          <div className="mr-1 w-4 flex justify-center">
            {item.type === 'folder' ? (
              item.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            ) : null}
          </div>
          
          <div className="mr-1.5">
            {getIcon()}
          </div>
          
          {isRenaming ? (
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  renameFile(item.id, renameValue);
                  setRenamingItem(null);
                } else if (e.key === 'Escape') {
                  setRenamingItem(null);
                }
              }}
              onBlur={() => {
                if (renameValue.trim() !== '') {
                  renameFile(item.id, renameValue);
                }
                setRenamingItem(null);
              }}
              className="py-0 h-6 text-xs"
              autoFocus
            />
          ) : (
            <span className="truncate">{item.name}</span>
          )}
          
          {item.type === 'file' && item.isModified && (
            <span className="ml-1 text-amber-500 font-bold">●</span>
          )}
          
          <div className="ml-auto opacity-0 group-hover:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <MoreVertical size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {item.type === 'folder' && (
                  <>
                    <DropdownMenuItem onClick={() => {
                      setNewItemType('file');
                      setNewItemParentPath(item.path);
                      setNewItemName('');
                    }}>
                      New File
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setNewItemType('folder');
                      setNewItemParentPath(item.path);
                      setNewItemName('');
                    }}>
                      New Folder
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onClick={() => {
                  setRenamingItem(item.id);
                  setRenameValue(item.name);
                }}>
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    deleteFile(item.id);
                    toast({
                      title: item.type === 'folder' ? 'Folder Deleted' : 'File Deleted',
                      description: `${item.name} has been deleted.`,
                    });
                  }}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {isCreatingInFolder && (
          <div className="pl-6 py-1">
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={`New ${newItemType}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newItemName.trim() !== '') {
                  createFile(item.path, newItemName, newItemType);
                  setNewItemType(null);
                } else if (e.key === 'Escape') {
                  setNewItemType(null);
                }
              }}
              onBlur={() => {
                if (newItemName.trim() !== '') {
                  createFile(item.path, newItemName, newItemType);
                }
                setNewItemType(null);
              }}
              className="py-0 h-6 text-xs"
              autoFocus
            />
          </div>
        )}
        
        {item.type === 'folder' && item.isOpen && item.children && (
          <div className="pl-4">
            {item.children.map(child => renderItem(child))}
          </div>
        )}
      </div>
    );
  };
  
  const filteredFiles = searchQuery.trim() !== '' 
    ? searchFiles(searchQuery)
    : files;
  
  return (
    <div className="flex flex-col h-full bg-editor">
      <div className="p-2 border-b border-border flex justify-between items-center">
        <h2 className="text-sm font-medium">Explorer</h2>
        
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setNewItemType('file');
              setNewItemParentPath('/my-project');
              setNewItemName('');
            }}
          >
            <Plus size={14} />
          </Button>
        </div>
      </div>
      
      <div className="p-2 border-b border-border">
        <Input
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-7 text-xs"
        />
      </div>
      
      <div className="flex-1 overflow-auto p-1 text-xs">
        {filteredFiles.map(file => renderItem(file))}
        
        {newItemParentPath === '/my-project' && newItemType && (
          <div className="py-1 px-2">
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={`New ${newItemType}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newItemName.trim() !== '') {
                  createFile('/my-project', newItemName, newItemType);
                  setNewItemType(null);
                } else if (e.key === 'Escape') {
                  setNewItemType(null);
                }
              }}
              onBlur={() => {
                if (newItemName.trim() !== '') {
                  createFile('/my-project', newItemName, newItemType);
                }
                setNewItemType(null);
              }}
              className="py-0 h-6 text-xs"
              autoFocus
            />
          </div>
        )}
        
        {filteredFiles.length === 0 && searchQuery.trim() !== '' && (
          <div className="p-4 text-center text-muted-foreground">
            No files found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
