import { editorTabs } from "../../catalogManagerUtils.js";

export function EditorTabs({ activeTab, onChange }) {
  const focusTab = (id) => {
    onChange(id);
    window.requestAnimationFrame(() => document.getElementById(`editor-tab-${id}`)?.focus());
  };

  const onKeyDown = (event, index) => {
    let nextIndex = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % editorTabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + editorTabs.length) % editorTabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = editorTabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    focusTab(editorTabs[nextIndex][0]);
  };

  return (
    <div className="tabs" role="tablist" aria-label="Bagian editor">
      {editorTabs.map(([id, label], index) => (
        <button
          key={id}
          id={`editor-tab-${id}`}
          type="button"
          role="tab"
          aria-selected={activeTab === id}
          aria-controls={`editor-panel-${id}`}
          tabIndex={activeTab === id ? 0 : -1}
          className={activeTab === id ? "active" : ""}
          onClick={() => onChange(id)}
          onKeyDown={(event) => onKeyDown(event, index)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
