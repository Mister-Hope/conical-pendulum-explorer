import React, { useEffect, useRef, useState } from 'react';
import { PendulumConfig } from '../types';

interface PendulumSimulationProps {
  height: number;
  pendulums: PendulumConfig[];
  isPlaying: boolean;
  angularVelocity: number;
}

export const PendulumSimulation: React.FC<PendulumSimulationProps> = ({
  height,
  pendulums,
  isPlaying,
  angularVelocity,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const timeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  // Camera State
  const cameraRef = useRef({
    yaw: 0,   // Rotation around Y axis
    pitch: 0.2, // Rotation around X axis (initial tilt)
    zoom: 1.0
  });
  
  // Mouse Interaction State
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (timestamp: number) => {
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
      const deltaTime = (timestamp - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = timestamp;

      if (isPlaying) {
        timeRef.current += deltaTime;
      }

      // Physics State
      const currentAngle = timeRef.current * angularVelocity;

      // Setup Canvas
      const width = canvas.width;
      const heightPx = canvas.height;
      const centerX = width / 2;
      const centerY = heightPx / 3; // Shift origin up a bit
      const metersToPixels = 220; // Scale up for large screen

      // Clear Canvas
      ctx.fillStyle = '#020617'; // slate-950
      ctx.fillRect(0, 0, width, heightPx);

      // --- 3D Projection Logic ---
      const project = (x: number, y: number, z: number) => {
        // 1. Rotate around Y axis (Yaw)
        const cosYaw = Math.cos(cameraRef.current.yaw);
        const sinYaw = Math.sin(cameraRef.current.yaw);
        const x1 = x * cosYaw - z * sinYaw;
        const z1 = x * sinYaw + z * cosYaw;

        // 2. Rotate around X axis (Pitch)
        const cosPitch = Math.cos(cameraRef.current.pitch);
        const sinPitch = Math.sin(cameraRef.current.pitch);
        const y2 = y * cosPitch - z1 * sinPitch;
        const z2 = y * sinPitch + z1 * cosPitch;

        // 3. Perspective Projection
        // Camera distance acts as the focal length
        const cameraDist = 2000; 
        const scale = cameraDist / (cameraDist + z2 * metersToPixels);

        return {
          x: centerX + x1 * metersToPixels * scale,
          y: centerY + y2 * metersToPixels * scale,
          scale: scale,
          zDepth: z2 // Used for sorting
        };
      };

      // --- Draw Scene Elements ---

      // 1. Suspension Point (Origin)
      const origin = project(0, 0, 0);
      
      // 2. Floor / Reference Plane (at y = height)
      // Draw a grid or circle on the floor
      const floorY = height; 
      
      // Draw Central Axis Line
      const floorCenter = project(0, floorY, 0);
      
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#334155'; // slate-700
      ctx.lineWidth = 2;
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(floorCenter.x, floorCenter.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Ceiling / Support structure
      ctx.beginPath();
      ctx.fillStyle = '#94a3b8';
      ctx.arc(origin.x, origin.y, 8 * origin.scale, 0, Math.PI * 2);
      ctx.fill();

      // --- Pendulums ---
      const objectsToRender = pendulums.map(p => {
        const r = Math.sqrt(Math.max(0, p.length * p.length - height * height));
        
        // Physics coordinates (Right-handed: Y down, Z forward/back)
        // Pos: x = r*cos(angle), y = height, z = r*sin(angle)
        const xPhys = r * Math.cos(currentAngle);
        const zPhys = r * Math.sin(currentAngle);
        const yPhys = height;

        const pos2D = project(xPhys, yPhys, zPhys);
        
        // Orbit Path (Trail)
        const pathPoints = [];
        for (let a = 0; a <= Math.PI * 2; a += 0.1) {
            const px = r * Math.cos(a);
            const pz = r * Math.sin(a);
            pathPoints.push(project(px, height, pz));
        }

        return {
            config: p,
            pos: pos2D,
            path: pathPoints,
            phys: { r, x: xPhys, y: yPhys, z: zPhys }
        };
      });

      // Sort by Z depth (Painter's algorithm) - render furthest first
      objectsToRender.sort((a, b) => b.pos.zDepth - a.pos.zDepth);

      objectsToRender.forEach(obj => {
        // Draw Orbit Path
        ctx.beginPath();
        ctx.strokeStyle = `${obj.config.color}44`; // Transparent
        ctx.lineWidth = 3 * obj.pos.scale;
        obj.path.forEach((pt, i) => {
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        ctx.stroke();

        // Draw String
        ctx.beginPath();
        ctx.strokeStyle = '#cbd5e1'; // slate-300
        ctx.lineWidth = 2 * obj.pos.scale;
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(obj.pos.x, obj.pos.y);
        ctx.stroke();

        // Draw Bob
        // Mass affects visual size
        const bobBaseSize = 12;
        const bobSize = (bobBaseSize + obj.config.mass * 4) * obj.pos.scale;
        
        ctx.beginPath();
        const grad = ctx.createRadialGradient(
            obj.pos.x - bobSize/3, obj.pos.y - bobSize/3, bobSize/4,
            obj.pos.x, obj.pos.y, bobSize
        );
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.5, obj.config.color);
        grad.addColorStop(1, '#000');
        ctx.fillStyle = grad;
        
        ctx.arc(obj.pos.x, obj.pos.y, bobSize, 0, Math.PI * 2);
        ctx.fill();

        // Labels (High contrast for projector)
        ctx.font = `bold ${Math.max(12, 14 * obj.pos.scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Label Background
        const labelText = `m=${obj.config.mass}kg`;
        const metrics = ctx.measureText(labelText);
        const pad = 4;
        
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(
            obj.pos.x - metrics.width/2 - pad, 
            obj.pos.y + bobSize + 5, 
            metrics.width + pad*2, 
            20
        );

        ctx.fillStyle = '#fff';
        ctx.fillText(labelText, obj.pos.x, obj.pos.y + bobSize + 15);
      });

      animationRef.current = requestAnimationFrame(render);
    };

    // Resize handler
    const resize = () => {
        if (canvasRef.current && canvasRef.current.parentElement) {
            canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
            canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
        }
    };
    window.addEventListener('resize', resize);
    resize();

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [height, pendulums, isPlaying, angularVelocity]);

  // Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    
    // Update camera angles
    cameraRef.current.yaw += deltaX * 0.01;
    // Limit pitch to avoid flipping over or going under floor too much
    cameraRef.current.pitch = Math.max(-0.5, Math.min(1.5, cameraRef.current.pitch + deltaY * 0.01));
    
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div className="w-full h-full cursor-move relative bg-slate-950">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};