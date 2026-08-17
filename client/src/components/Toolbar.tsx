import { useState } from "react";

export default function Toolbar() {
  const [open, setOpen] = useState(true);

  return (
    <div className="absolute bottom-4 left-4 z-10">
      {open ? (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-slate-700">How to use</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-sm"
            >
              ✕
            </button>
          </div>
          <ul className="text-xs text-slate-600 space-y-1.5">
            <li>
              <strong>1.</strong> Add boxes using the buttons in the top bar.
            </li>
            <li>
              <strong>2.</strong> Type your idea in an <span className="text-amber-600 font-semibold">💡 Idea Box</span>, or upload an image in an <span className="text-emerald-600 font-semibold">🖼️ Image Box</span>.
            </li>
            <li>
              <strong>3.</strong> Drag from a box right edge ● to connect to another box left edge ●.
            </li>
            <li>
              <strong>4.</strong> Click <strong>▶ Run</strong> on any AI box (Research, PRD, Summarize, Cartoon, Slides, Code) to generate output.
            </li>
            <li>
              <strong>5.</strong> Click <strong>⚙</strong> to edit the AI prompt template.
            </li>
            <li>
              <strong>6.</strong> Use {"{{input_1}}"}, {"{{input_2}}"} in prompts to reference connected inputs.
            </li>
            <li className="pt-1 border-t border-slate-100 mt-2">
              <span className="text-pink-600 font-semibold">🎨 Cartoon Profile</span>: Connect an Image box for image-to-image, or an Idea box for text-to-image.
            </li>
            <li>
              <span className="text-orange-500 font-semibold">📊 Slides</span>: Connect Research boxes to generate a visual pitch deck with prev/next navigation.
            </li>
            <li>
              <span className="text-cyan-500 font-semibold">💻 Code</span>: Connect a PRD or Research box to generate a React prototype with live preview.
            </li>
            <li>
              <span className="text-indigo-400 font-semibold">📄 PRD</span>: Connect Research boxes to generate a structured Product Requirements Document — then feed it into a Code box for better prototypes.
            </li>
            <li>
              <strong>Resize:</strong> Click a box, then drag the corner/edge handles to resize it.
            </li>
          </ul>
          <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-400">
            Your board auto-saves to the browser.
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="bg-white rounded-full shadow-lg border border-slate-200 w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-700"
          title="Show help"
        >
          ?
        </button>
      )}
    </div>
  );
}