import React, { useState, useMemo, useEffect } from "react";
import { PendulumSimulation } from "./components/PendulumSimulation";
import { Controls } from "./components/Controls";
import { DataPanel } from "./components/DataPanel";
import { Latex } from "./components/Latex";
import { GRAVITY } from "./constants";
import { PendulumConfig } from "./types";

const INITIAL_PENDULUMS: PendulumConfig[] = [
  { id: 1, length: 2.0, mass: 1.0, color: "#3b82f6", label: "蓝球" },
  { id: 2, length: 1.5, mass: 2.0, color: "#ef4444", label: "红球" },
  { id: 3, length: 1.8, mass: 0.5, color: "#22c55e", label: "绿球" },
];

export default function App() {
  // Height (h) is the independent variable shared by all conical pendulums
  const [height, setHeight] = useState<number>(1.2);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [pendulums, setPendulums] =
    useState<PendulumConfig[]>(INITIAL_PENDULUMS);

  // Calculate shared physics properties
  const angularVelocity = useMemo(() => Math.sqrt(GRAVITY / height), [height]);
  const period = useMemo(
    () => (2 * Math.PI) / angularVelocity,
    [angularVelocity],
  );

  // Determine the maximum allowable height based on the shortest string
  const minLength = Math.min(...pendulums.map((p) => p.length));
  const maxHeight = minLength * 0.99; // Cap extremely close to L to allow low theta

  // Auto-correct height if lengths change to be smaller than current height
  useEffect(() => {
    if (height > maxHeight) {
      setHeight(maxHeight);
    }
  }, [maxHeight, height]);

  const handleHeightChange = (newHeight: number) => {
    const safeHeight = Math.min(Math.max(0.1, newHeight), maxHeight);
    setHeight(safeHeight);
  };

  const handlePendulumUpdate = (
    id: number,
    updates: Partial<PendulumConfig>,
  ) => {
    setPendulums((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return { ...p, ...updates };
      }),
    );
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden flex flex-col">
      {/* Header - Compact */}
      <header className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center shrink-0 h-16">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          圆锥摆演示教学系统
        </h1>
      </header>

      <main className="flex-grow flex flex-row overflow-hidden h-[calc(100vh-4rem)]">
        {/* Left Column: Controls & Data - 30% Width (approx 400px-450px) */}
        <div className="w-[420px] shrink-0 flex flex-col bg-slate-900/50 border-r border-slate-800 overflow-y-auto custom-scrollbar p-6 gap-6">
          <Controls
            height={height}
            setHeight={handleHeightChange}
            maxHeight={maxHeight}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            pendulums={pendulums}
            onUpdatePendulum={handlePendulumUpdate}
          />

          <DataPanel
            height={height}
            angularVelocity={angularVelocity}
            period={period}
            pendulums={pendulums}
          />
        </div>

        {/* Middle Column: Simulation (Flexible Width) */}
        <div className="flex-grow relative bg-slate-950 overflow-hidden flex flex-col">
          <div className="w-full h-full">
            <PendulumSimulation
              height={height}
              pendulums={pendulums}
              isPlaying={isPlaying}
              angularVelocity={angularVelocity}
            />
          </div>
        </div>

        {/* Right Column: Theory & Derivation - Fixed Width */}
        <div className="w-[450px] shrink-0 bg-slate-900/50 border-l border-slate-800 overflow-y-auto custom-scrollbar p-8">
          <h2 className="text-2xl font-bold mb-6 text-indigo-300 border-b border-indigo-500/30 pb-3">
            原理推导
          </h2>

          <div className="space-y-8 text-lg text-slate-300 leading-relaxed">
            {/* Step 1 */}
            <section>
              <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-xs flex items-center justify-center">
                  1
                </span>
                受力分析
              </h3>
              <p className="mb-2 text-slate-400">
                小球受重力 <Latex>mg</Latex> 和绳子拉力 <Latex>T</Latex>。
                在竖直方向受力平衡，水平方向提供向心力。
              </p>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div className="mb-2">
                  竖直方向：<Latex block>{String.raw`T \cos\theta = mg`}</Latex>
                </div>
                <div>
                  水平方向：
                  <Latex
                    block
                  >{String.raw`T \sin\theta = F_{n} = m \omega^2 r`}</Latex>
                </div>
              </div>
            </section>

            {/* Step 2 */}
            <section>
              <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-xs flex items-center justify-center">
                  2
                </span>
                几何关系
              </h3>
              <p className="mb-2 text-slate-400">
                绳长 <Latex>L</Latex>，回转半径 <Latex>r</Latex>，悬点高度{" "}
                <Latex>h</Latex>。
              </p>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <Latex block>{String.raw`\tan\theta = \frac{r}{h}`}</Latex>
              </div>
            </section>

            {/* Step 3 */}
            <section>
              <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-xs flex items-center justify-center">
                  3
                </span>
                联立求解
              </h3>
              <p className="mb-2 text-slate-400">将水平方程除以竖直方程：</p>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                <Latex
                  block
                >{String.raw`\tan\theta = \frac{m \omega^2 r}{mg} = \frac{\omega^2 r}{g}`}</Latex>
                <p className="text-center my-2">
                  代入几何关系 <Latex>{String.raw`\tan\theta = r/h`}</Latex>
                </p>
                <Latex
                  block
                >{String.raw`\frac{r}{h} = \frac{\omega^2 r}{g}`}</Latex>
                <p className="text-center my-2">
                  消去 <Latex>r</Latex> (当 <Latex>r \neq 0</Latex>)
                </p>
                <Latex
                  block
                >{String.raw`\omega^2 = \frac{g}{h} \implies \omega = \sqrt{\frac{g}{h}}`}</Latex>
              </div>
            </section>

            {/* Conclusion */}
            <section className="bg-indigo-900/20 border border-indigo-500/30 p-5 rounded-xl">
              <h3 className="text-xl font-bold text-indigo-300 mb-2">
                核心结论
              </h3>
              <p>
                圆锥摆的角速度 <Latex>\omega</Latex>{" "}
                <strong>
                  只与垂直高度 <Latex>h</Latex> 有关
                </strong>
                。
              </p>
              <p className="mt-2 font-bold text-white">
                与小球质量 <Latex>m</Latex> 无关，与绳长 <Latex>L</Latex> 无关。
              </p>
            </section>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f172a; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569; 
        }
      `}</style>
    </div>
  );
}
