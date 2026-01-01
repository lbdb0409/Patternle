'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { X, Eraser, Trash2, Pen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScratchpadProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tool = 'pen' | 'eraser';

export function Scratchpad({ isOpen, onClose }: ScratchpadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [isOpen]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setLastPos(getPos(e));
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPos) return;
    e.preventDefault();

    const ctx = getCanvasContext();
    if (!ctx) return;

    const pos = getPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);

    if (tool === 'pen') {
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 20;
    }

    ctx.stroke();
    setLastPos(pos);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPos(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Working Out</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setTool('pen')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium',
              tool === 'pen'
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'bg-gray-100 dark:bg-gray-800'
            )}
          >
            <Pen size={16} />
            Pen
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium',
              tool === 'eraser'
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'bg-gray-100 dark:bg-gray-800'
            )}
          >
            <Eraser size={16} />
            Eraser
          </button>
          <button
            onClick={clearCanvas}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
          >
            <Trash2 size={16} />
            Clear
          </button>
        </div>

        <canvas
          ref={canvasRef}
          className="w-full h-64 border border-gray-200 dark:border-gray-700 rounded-lg bg-white scratchpad-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        <p className="text-xs text-gray-500 mt-2 text-center">
          Use this space to work out your calculations
        </p>
      </div>
    </div>
  );
}
