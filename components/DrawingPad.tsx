import React, { useRef, useState, useEffect } from 'react';
import { ThemeColor } from '../types';

interface DrawingPadProps {
  onSave: (imageData: string) => void;
  onCancel: () => void;
  theme: ThemeColor;
}

const DrawingPad: React.FC<DrawingPadProps> = ({ onSave, onCancel, theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  // Theme colors mapping
  const colors: Record<ThemeColor, string> = {
    cyan: '#22d3ee',
    amber: '#fbbf24',
    emerald: '#34d399',
    rose: '#fb7185'
  };
  
  const activeColor = colors[theme];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Set resolution to match window exactly
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.strokeStyle = activeColor;
        context.lineWidth = 4;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.shadowBlur = 8;
        context.shadowColor = activeColor;
        setCtx(context);
      }
    }
  }, [theme, activeColor]);

  const getCoordinates = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    if (!ctx || !canvasRef.current) return;
    // Prevent default to stop scrolling on touch devices
    // e.preventDefault(); // handled by style touch-action: none
    
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || !ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!ctx) return;
    setIsDrawing(false);
    ctx.closePath();
  };

  const clearCanvas = () => {
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleSave = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <div className="absolute top-4 left-0 right-0 text-center pointer-events-none select-none">
        <h2 className="text-gray-500 text-sm tracking-widest font-digital animate-pulse">
          WRITE NOTE FOR MORNING
        </h2>
      </div>

      <canvas
        ref={canvasRef}
        className="touch-none cursor-crosshair bg-black w-full h-full block"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      <div className="absolute bottom-8 flex gap-6 pointer-events-auto">
        <button 
          onClick={onCancel}
          className="px-6 py-2 rounded-full border border-gray-800 text-gray-500 hover:text-white hover:border-gray-500 transition-all font-digital tracking-wider text-sm"
        >
          BACK
        </button>
        <button 
          onClick={clearCanvas}
          className="px-6 py-2 rounded-full border border-gray-800 text-gray-500 hover:text-white hover:border-gray-500 transition-all font-digital tracking-wider text-sm"
        >
          CLEAR
        </button>
        <button 
          onClick={handleSave}
          className="px-8 py-2 rounded-full bg-gray-900 border border-gray-700 text-white hover:bg-white hover:text-black transition-all font-digital tracking-wider shadow-[0_0_15px_rgba(255,255,255,0.1)] text-sm"
          style={{ borderColor: activeColor, boxShadow: `0 0 10px ${activeColor}40` }}
        >
          SAVE
        </button>
      </div>
    </div>
  );
};

export default DrawingPad;