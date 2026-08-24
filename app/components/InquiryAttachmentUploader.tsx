"use client";

import { useState } from "react";

type UploadedFile = { id: string; name: string; size: number; uploadedAt: string };

const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.pptx,.zip";
const MAX_FILES = 5;
const MAX_BYTES = 15 * 1024 * 1024;

function fallbackContentType(file: File) {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();
  return ({ pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", zip: "application/zip", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation" } as Record<string, string>)[extension || ""] || "";
}

export default function InquiryAttachmentUploader({ reference, accessCode, tone = "dark", locale = "en" }: { reference: string; accessCode: string; tone?: "dark" | "light"; locale?: "en" | "zh" }) {
  const zh = locale === "zh";
  const [files, setFiles] = useState<File[]>([]);
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const [message, setMessage] = useState(zh ? "可选：询盘保存后可添加Logo、技术包、尺码表或参考文件。" : "Optional: add a logo, tech pack, size chart or reference file after saving the inquiry.");
  const [uploading, setUploading] = useState(false);

  function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files || []).slice(0, MAX_FILES - uploaded.length);
    const invalid = selected.find((file) => !fallbackContentType(file) || file.size < 1 || file.size > MAX_BYTES);
    if (invalid) { setFiles([]); setMessage(zh ? `${invalid.name}格式不被接受或超过15 MB。` : `${invalid.name} is not an accepted file or exceeds 15 MB.`); return; }
    setFiles(selected); setMessage(zh ? `已选择${selected.length}个文件，等待上传。` : `${selected.length} file${selected.length === 1 ? "" : "s"} ready to upload.`);
  }

  async function upload() {
    if (!files.length) return;
    setUploading(true);
    try {
      const completed: UploadedFile[] = [];
      for (const file of files) {
        const contentType = fallbackContentType(file);
        const request = { reference, accessCode, name: file.name, contentType, size: file.size };
        const permissionResponse = await fetch("/api/inquiry-attachments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
        const permission = await permissionResponse.json().catch(() => ({}));
        if (!permissionResponse.ok || !permission.ok) throw new Error(permission.message || (zh ? `无法准备${file.name}。` : `Could not prepare ${file.name}.`));
        const putResponse = await fetch(permission.uploadUrl, { method: "PUT", headers: { "Content-Type": permission.contentType }, body: file });
        if (!putResponse.ok) throw new Error(zh ? `${file.name}传输失败。` : `${file.name} could not be transferred.`);
        const finalizeResponse = await fetch("/api/inquiry-attachments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...request, uploadId: permission.uploadId, key: permission.key }) });
        const finalized = await finalizeResponse.json().catch(() => ({}));
        if (!finalizeResponse.ok || !finalized.ok) throw new Error(finalized.message || (zh ? `${file.name}无法关联到询盘。` : `${file.name} could not be attached.`));
        completed.push(finalized.attachment);
      }
      setUploaded((current) => [...current, ...completed]);
      setFiles([]);
      setMessage(zh ? `${completed.length}个文件已安全关联到${reference}。` : `${completed.length} file${completed.length === 1 ? "" : "s"} securely attached to ${reference}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : (zh ? "文件无法上传。" : "The files could not be uploaded.")); }
    finally { setUploading(false); }
  }

  return <section className={`inquiry-attachment-uploader uploader-${tone}`} aria-label={zh ? "询盘文件上传" : "Inquiry file upload"}>
    <div><strong>{zh ? "添加买家文件" : "Add buyer files"}</strong><p>{zh ? "支持PDF、JPG、PNG、WEBP、DOCX、XLSX、PPTX或ZIP；每个不超过15 MB，最多5个。" : "PDF, JPG, PNG, WEBP, DOCX, XLSX, PPTX or ZIP · up to 15 MB each · maximum 5 files."}</p></div>
    {uploaded.length < MAX_FILES && <div className="attachment-actions"><label className="attachment-picker">{zh ? "选择文件" : "Choose files"}<input type="file" accept={ACCEPTED} multiple onChange={choose} disabled={uploading} /></label><button className="button button-small" type="button" onClick={upload} disabled={uploading || !files.length}>{uploading ? (zh ? "上传中……" : "Uploading…") : (zh ? "上传并关联" : "Attach files")}</button></div>}
    {uploaded.length ? <ul>{uploaded.map((file) => <li key={file.id}><span>{file.name}</span><small>{Math.ceil(file.size / 1024)} KB {zh ? "已关联" : "attached"}</small></li>)}</ul> : null}
    <p className="attachment-message" aria-live="polite">{message}</p>
    <small>{zh ? "文件仅关联到本次询盘供贝强审核。上传目标或参考资料不代表该要求已被确认可用于生产。" : "Files are linked to this inquiry for Beiqiang review. Uploading a target or reference does not confirm that it can be achieved in production."}</small>
  </section>;
}
