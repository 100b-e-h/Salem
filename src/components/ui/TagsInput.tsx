'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import { Badge } from './Badge';
import { Input } from './input';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface TagsInputProps {
  value?: string[];
  onChange?: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  maxTags?: number;
}

export const TagsInput: React.FC<TagsInputProps> = ({
  value = [],
  onChange,
  placeholder = 'Adicionar tag...',
  className,
  maxTags,
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    
    // Validate tag
    if (!trimmedTag) return;
    if (value.includes(trimmedTag)) {
      setInputValue('');
      return;
    }
    if (maxTags && value.length >= maxTags) {
      setInputValue('');
      return;
    }

    // Add tag
    const newTags = [...value, trimmedTag];
    onChange?.(newTags);
    setInputValue('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = value.filter(tag => tag !== tagToRemove);
    onChange?.(newTags);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last tag on backspace if input is empty
      handleRemoveTag(value[value.length - 1]);
    }
  };

  const handleBlur = () => {
    // Add tag on blur if there's content
    if (inputValue.trim()) {
      handleAddTag(inputValue);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full"
      />
      
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="pl-3 pr-1 py-1 text-xs flex items-center gap-1.5 hover:bg-secondary/80 transition-colors"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:bg-muted rounded-sm p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      
      {maxTags && (
        <p className="text-xs text-muted-foreground">
          {value.length}/{maxTags} tags
        </p>
      )}
    </div>
  );
};
