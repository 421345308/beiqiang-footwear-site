"use client";

export type ContactPreferences = {
  preferredContactMethod: string;
  preferredResponseLanguage: string;
  buyerTimezone: string;
  preferredContactWindow: string;
};

type ContactPreferenceFieldsProps = {
  locale?: "en" | "zh";
  value: ContactPreferences;
  onChange: (value: ContactPreferences) => void;
  legend?: string;
};

export const EMPTY_CONTACT_PREFERENCES: ContactPreferences = {
  preferredContactMethod: "",
  preferredResponseLanguage: "",
  buyerTimezone: "",
  preferredContactWindow: "",
};

export default function ContactPreferenceFields({ locale = "en", value, onChange, legend }: ContactPreferenceFieldsProps) {
  const zh = locale === "zh";
  function update(field: keyof ContactPreferences, nextValue: string) {
    onChange({ ...value, [field]: nextValue });
  }

  return (
    <fieldset className="contact-preference-fields">
      <legend>{legend || (zh ? "联系偏好（选填）" : "Response preferences (optional)")}</legend>
      <label>{zh ? "优先联系渠道" : "Preferred contact channel"}<select value={value.preferredContactMethod} onChange={(event) => update("preferredContactMethod", event.target.value)}><option value="">{zh ? "无偏好" : "No preference"}</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="either">{zh ? "均可" : "Either available channel"}</option></select></label>
      <label>{zh ? "回复语言" : "Preferred response language"}<select value={value.preferredResponseLanguage} onChange={(event) => update("preferredResponseLanguage", event.target.value)}><option value="">{zh ? "无偏好" : "No preference"}</option><option value="en">English</option><option value="zh">中文</option><option value="de">Deutsch</option><option value="fr">Français</option><option value="es">Español</option><option value="other">{zh ? "其他，请确认" : "Other — please confirm"}</option></select></label>
      <label>{zh ? "所在时区 / 城市" : "Your time zone / city"}<input value={value.buyerTimezone} onChange={(event) => update("buyerTimezone", event.target.value)} maxLength={80} placeholder={zh ? "例如：柏林 CET / UTC+1" : "e.g. Berlin CET / UTC+1"} /></label>
      <label>{zh ? "方便联系的当地时间" : "Convenient local contact time"}<input value={value.preferredContactWindow} onChange={(event) => update("preferredContactWindow", event.target.value)} maxLength={160} placeholder={zh ? "例如：工作日 9:00–12:00" : "e.g. weekdays 9:00–12:00"} /></label>
      <p className="contact-preference-note">{zh ? "这些信息只用于安排人工回复，不代表已预约、自动发信或承诺回复时效；语言需求需由团队确认。" : "These details guide a human reply. They do not create an appointment, send a message automatically or guarantee response timing; language availability remains subject to confirmation."}</p>
    </fieldset>
  );
}
