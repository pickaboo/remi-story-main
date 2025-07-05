import React, { useRef, useEffect, TextareaHTMLAttributes, memo, useCallback } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea: React.FC<TextAreaProps> = memo(({ label, id, error, className, value, ...props }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const errorId = error && id ? `${id}-error` : undefined;

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to 'auto' to let CSS (including min-height) determine the starting point
      textarea.style.height = 'auto'; 
      
      const computedStyle = getComputedStyle(textarea);
      const minHeight = parseFloat(computedStyle.minHeight) || 0;
      
      // Assuming max-h-40 which translates to 10rem (160px if 1rem=16px)
      // It's safer to parse max-height if it can vary, but for a fixed class, this is okay.
      let maxHeight = 160; 
      const cssMaxHeight = parseFloat(computedStyle.maxHeight);
      if (!isNaN(cssMaxHeight) && cssMaxHeight > 0) { // Check if maxHeight is a number and not 'none' etc.
        maxHeight = cssMaxHeight;
      }

      const scrollHeight = textarea.scrollHeight; // scrollHeight is content + padding

      const borderTopWidth = parseFloat(computedStyle.borderTopWidth) || 0;
      const borderBottomWidth = parseFloat(computedStyle.borderBottomWidth) || 0;
      const totalBorderWidth = borderTopWidth + borderBottomWidth;

      // Calculate the target border-box height
      let targetHeight = scrollHeight + totalBorderWidth;

      // Clamp by minHeight and maxHeight
      targetHeight = Math.max(minHeight, targetHeight);
      targetHeight = Math.min(maxHeight, targetHeight);
      
      textarea.style.height = `${targetHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]); // Adjust height whenever the value changes

  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-muted-text dark:text-slate-400 mb-1">{label}</label>}
      <textarea
        id={id}
        ref={textareaRef}
        value={value}
        rows={1} // Start with a single row effectively, height will adjust
        className={`block w-full px-4 py-2 border border-border-color dark:border-dark-bg/30 rounded-xl shadow-sm bg-input-bg dark:bg-dark-bg dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 focus:border-primary dark:focus:border-blue-400 text-base leading-6 resize-none overflow-y-hidden min-h-[42px] max-h-40 ${error ? 'border-red-500 dark:border-red-400 ring-red-500 dark:ring-red-400' : ''} ${className}`}
        aria-invalid={!!error}
        aria-describedby={errorId}
        {...props}
      />
      {error && <p id={errorId} className="mt-1 text-xs text-danger dark:text-red-400">{error}</p>}
    </div>
  );
});

TextArea.displayName = 'TextArea';
