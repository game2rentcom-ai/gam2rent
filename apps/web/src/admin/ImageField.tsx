import { useRef, useState } from "react";
import { useAuth } from "../auth/context";
import { TextField } from "../ui/Form";
import { Button } from "../ui/Button";
import { errorMessage } from "../lib/api";

// Upload a picture (stored in the public game-media bucket) or paste an https address. Only images up
// to 5 MB are accepted, checked here and again by the storage bucket's own rules.
const TYPES = ["image/jpeg", "image/png", "image/webp"];
const EXTENSION: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** folder for the file, e.g. the game's id */
  folder: string;
  kind: "cover" | "banner";
  hint?: string;
}

export function ImageField({ label, value, onChange, folder, kind, hint }: Props) {
  const { client } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File) => {
    setError("");
    if (!TYPES.includes(file.type)) return setError("Please choose a JPG, PNG or WebP image.");
    if (file.size > 5 * 1024 * 1024) return setError("That image is over 5 MB. Please choose a smaller one.");
    if (!folder) return setError("Enter the game’s title first, so we know where to save the picture.");
    setBusy(true);
    try {
      const supabase = await client();
      const path = `games/${folder}/${kind}-${Date.now()}.${EXTENSION[file.type]}`;
      const { error: failure } = await supabase.storage.from("game-media").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
      if (failure) throw failure;
      onChange(supabase.storage.from("game-media").getPublicUrl(path).data.publicUrl);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-text-primary">{label}</p>
      <div className="flex items-center gap-3">
        <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-bg-base ${kind === "cover" ? "h-24 w-16" : "h-16 w-28"}`}>
          {value ? <img src={value} alt={`${label} preview`} className="h-full w-full object-cover" /> : <span className="px-1 text-center text-xs text-text-muted">No picture</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => input.current?.click()} disabled={busy}>{busy ? "Uploading…" : value ? "Replace picture" : "Upload picture"}</Button>
          {value && <Button variant="ghost" onClick={() => onChange("")} disabled={busy}>Remove</Button>}
        </div>
        <input
          ref={input}
          type="file"
          accept={TYPES.join(",")}
          aria-label={`${label} file`}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
      </div>
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      {error && <p role="alert" className="text-xs font-medium text-red-300">{error}</p>}
      <details className="text-sm">
        <summary className="flex min-h-11 cursor-pointer items-center text-text-muted">Or paste a picture address</summary>
        <TextField label={`${label} address`} type="url" inputMode="url" placeholder="https://…" value={value} onChange={(e) => onChange(e.target.value.trim())} />
      </details>
    </div>
  );
}
