"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  createContext,
  useContext,
  type ReactNode,
  type FormEvent,
} from "react";
import { X, Loader2, CheckCircle2, ChevronDown } from "lucide-react";

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-primary" : "bg-[#dee2e6]"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface DrawerFormCtx {
  values: Record<string, any>;
  setValue: (name: string, value: any) => void;
  readOnly: boolean;
}

const DrawerFormContext = createContext<DrawerFormCtx>({
  values: {},
  setValue: () => {},
  readOnly: false,
});

export function useDrawerField(name: string, defaultValue?: any) {
  const ctx = useContext(DrawerFormContext);
  const value =
    ctx.values[name] !== undefined ? ctx.values[name] : (defaultValue ?? "");

  useEffect(() => {
    if (ctx.values[name] === undefined && defaultValue !== undefined) {
      ctx.setValue(name, defaultValue);
    }
  }, [name, defaultValue]);

  return {
    value,
    onChange: (v: any) => ctx.setValue(name, v),
    readOnly: ctx.readOnly,
  };
}

// ─── Shared style tokens ──────────────────────────────────────────────────────

const labelCls =
  "block text-[11px] font-bold uppercase tracking-wider text-[#6c757d] mb-1.5";

const inputCls =
  "w-full rounded-xl border border-[#e9ebec] bg-[#f8f9fa] px-4 py-2.5 text-sm font-medium text-[#343a40] placeholder:text-[#adb5bd] outline-none transition-all focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/8";

// ─── SideDrawer ───────────────────────────────────────────────────────────────

export interface SideDrawerProps {
  formKey: string;
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (values: Record<string, any>) => Promise<void>;
  submitLabel?: string;
  submitDanger?: boolean;
  width?: number | string;
  footerExtra?: ReactNode;
  readOnly?: boolean;
  onValuesChange?: (name: string, value: any) => void;
  children: ReactNode;
}

export function SideDrawer({
  formKey,
  title,
  subtitle,
  isOpen,
  onClose,
  onSubmit,
  onValuesChange,
  submitLabel = "Save",
  submitDanger = false,
  width = 500,
  footerExtra,
  readOnly = false,
  children,
}: SideDrawerProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [prevKey, setPrevKey] = useState(formKey);

  // Reset when formKey changes (switching between create / edit)
  if (formKey !== prevKey) {
    setValues({});
    setError(null);
    setSubmitState("idle");
    setPrevKey(formKey);
  }

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const setValue = useCallback(
    (name: string, value: any) => {
      setValues((p) => ({ ...p, [name]: value }));
      onValuesChange?.(name, value);
    },
    [onValuesChange]
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (readOnly || !onSubmit) return;
    setError(null);
    setSubmitState("loading");
    try {
      await onSubmit(values);
      setSubmitState("success");
      setTimeout(() => {
        setSubmitState("idle");
        onClose();
      }, 700);
    } catch (err: any) {
      setSubmitState("idle");
      setError(err?.response?.data?.message ?? err?.message ?? "Something went wrong.");
    }
  }

  const panelWidth = typeof width === "number" ? `${width}px` : width;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[1000] bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed bottom-0 right-0 top-0 z-[1001] flex flex-col border-l border-[#e9ebec] bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
        style={{
          width: panelWidth,
          maxWidth: "100vw",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[#f1f3f5] px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-[15px] font-extrabold text-[#343a40]">
                {title}
              </h2>
              {readOnly && (
                <span className="rounded-md bg-[#f1f3f5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6c757d]">
                  Read Only
                </span>
              )}
            </div>
            {subtitle && (
              <p className="mt-0.5 truncate text-[12px] text-[#6c757d]">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[#e9ebec] text-[#adb5bd] transition-all hover:bg-[#f8f9fa] hover:text-[#343a40]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form
          id="side-drawer-form"
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <DrawerFormContext.Provider value={{ values, setValue, readOnly }}>
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
              {children}

              {error && (
                <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-[12px] font-semibold text-danger animate-in slide-in-from-top-1 duration-200">
                  {error}
                </div>
              )}
            </div>
          </DrawerFormContext.Provider>

          {/* Footer */}
          <div className="flex flex-shrink-0 items-center justify-between border-t border-[#f1f3f5] px-6 py-4">
            <div>{footerExtra}</div>
            <div className="flex items-center gap-3">
              {!readOnly ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitState !== "idle"}
                    className="rounded-xl px-4 py-2 text-sm font-bold text-[#6c757d] transition-all hover:bg-[#f8f9fa] hover:text-[#343a40] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="side-drawer-form"
                    disabled={submitState !== "idle"}
                    className={`flex min-w-[110px] items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white shadow-md transition-all disabled:opacity-60 ${
                      submitState === "success"
                        ? "bg-success shadow-success/20"
                        : submitDanger
                        ? "bg-danger shadow-danger/20 hover:bg-danger/90"
                        : "bg-primary shadow-primary/20 hover:bg-primary/90 active:scale-95"
                    }`}
                  >
                    {submitState === "loading" && (
                      <Loader2 size={15} className="animate-spin" />
                    )}
                    {submitState === "success" && <CheckCircle2 size={15} />}
                    {submitState === "loading"
                      ? "Saving…"
                      : submitState === "success"
                      ? "Saved!"
                      : submitLabel}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-[#e9ebec] px-5 py-2 text-sm font-bold text-[#343a40] transition-all hover:bg-[#f8f9fa]"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Field components ─────────────────────────────────────────────────────────

export function DrawerInput({
  name,
  label,
  placeholder,
  isRequired = false,
  type = "text",
  defaultValue,
}: {
  name: string;
  label: string;
  placeholder?: string;
  isRequired?: boolean;
  type?: string;
  defaultValue?: string;
}) {
  const { value, onChange, readOnly } = useDrawerField(name, defaultValue);
  if (readOnly) return <DrawerViewField label={label} value={value} />;

  return (
    <div>
      <label className={labelCls}>
        {label}
        {isRequired && <span className="ml-0.5 text-danger">*</span>}
      </label>
      <input
        type={type}
        value={value}
        required={isRequired}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </div>
  );
}

export function DrawerTextarea({
  name,
  label,
  placeholder,
  rows = 4,
  defaultValue,
}: {
  name: string;
  label: string;
  placeholder?: string;
  rows?: number;
  defaultValue?: string;
}) {
  const { value, onChange, readOnly } = useDrawerField(name, defaultValue);
  if (readOnly) return <DrawerViewField label={label} value={value} />;

  return (
    <div>
      <label className={labelCls}>{label}</label>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} resize-y leading-relaxed`}
      />
    </div>
  );
}

export function DrawerSelect({
  name,
  label,
  options,
  isRequired = false,
  defaultValue,
  placeholder = "Select…",
}: {
  name: string;
  label: string;
  options: { label: string; value: string }[];
  isRequired?: boolean;
  defaultValue?: string;
  placeholder?: string;
}) {
  const { value, onChange, readOnly } = useDrawerField(name, defaultValue);

  if (readOnly) {
    const selected = options.find((o) => o.value === value)?.label ?? value;
    return <DrawerViewField label={label} value={selected} />;
  }

  return (
    <div>
      <label className={labelCls}>
        {label}
        {isRequired && <span className="ml-0.5 text-danger">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          required={isRequired}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} cursor-pointer appearance-none pr-9`}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#adb5bd]"
        />
      </div>
    </div>
  );
}

export function DrawerToggle({
  name,
  label,
  description,
  defaultValue = true,
}: {
  name: string;
  label: string;
  description?: string;
  defaultValue?: boolean;
}) {
  const { value, onChange, readOnly } = useDrawerField(name, defaultValue);

  return (
    <div className="flex items-center justify-between rounded-xl border border-[#e9ebec] bg-[#f8f9fa] px-4 py-3.5">
      <div className="mr-4 flex-1">
        <p className="text-[13px] font-bold text-[#343a40]">{label}</p>
        {description && (
          <p className="mt-0.5 text-[11px] text-[#6c757d]">{description}</p>
        )}
      </div>
      <Toggle
        checked={!!value}
        onChange={() => !readOnly && onChange(!value)}
        disabled={readOnly}
      />
    </div>
  );
}

export function DrawerDivider({ label }: { label?: string }) {
  if (!label) return <div className="h-px bg-[#f1f3f5]" />;
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-[#f1f3f5]" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#adb5bd]">
        {label}
      </span>
      <div className="h-px flex-1 bg-[#f1f3f5]" />
    </div>
  );
}

export function DrawerViewField({
  label,
  value,
}: {
  label: string;
  value?: any;
}) {
  return (
    <div>
      <p className={labelCls}>{label}</p>
      <div className="flex min-h-[42px] items-center rounded-xl border border-[#e9ebec] bg-[#f8f9fa] px-4 py-2.5 text-sm font-medium text-[#343a40]">
        {value || (
          <span className="italic text-[#adb5bd]">Not provided</span>
        )}
      </div>
    </div>
  );
}

export function DrawerImageUpload({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  const { onChange, readOnly } = useDrawerField(name);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(defaultValue ?? null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange(file);
    setPreview(URL.createObjectURL(file));
  }

  function remove() {
    onChange(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  if (readOnly) {
    return (
      <div>
        <p className={labelCls}>{label}</p>
        {preview ? (
          <img src={preview} className="h-40 w-full rounded-xl object-cover border border-[#e9ebec]" />
        ) : (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-[#e9ebec] bg-[#f8f9fa] text-[12px] text-[#adb5bd]">
            No image
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input
        type="file"
        accept="image/*"
        ref={fileRef}
        onChange={handleFile}
        className="hidden"
      />
      {preview ? (
        <div className="group relative overflow-hidden rounded-xl border border-[#e9ebec]">
          <img src={preview} className="h-40 w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-lg bg-white px-3 py-1.5 text-[12px] font-bold text-[#343a40] hover:bg-[#f8f9fa]"
            >
              Change
            </button>
            <button
              type="button"
              onClick={remove}
              className="rounded-lg bg-danger px-3 py-1.5 text-[12px] font-bold text-white"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className="flex h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#dee2e6] bg-[#f8f9fa] transition-all hover:border-primary/40 hover:bg-primary/5"
        >
          <p className="text-[13px] font-bold text-primary">Click to upload</p>
          <p className="mt-1 text-[11px] text-[#adb5bd]">JPG, PNG or WEBP · max 2 MB</p>
        </div>
      )}
    </div>
  );
}

export function DrawerImageView({
  label,
  src,
}: {
  label: string;
  src?: string;
}) {
  return (
    <div>
      <p className={labelCls}>{label}</p>
      {src ? (
        <img src={src} className="h-40 w-full rounded-xl object-cover border border-[#e9ebec]" />
      ) : (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-[#e9ebec] bg-[#f8f9fa] text-[12px] text-[#adb5bd]">
          No image provided
        </div>
      )}
    </div>
  );
}