export function normalizeWorkspaceEmail(value) {
  const email = typeof value === "string" ? value.trim().toLowerCase().slice(0, 180) : "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

export function workspaceContactCanRead(record, emailValue) {
  const email = normalizeWorkspaceEmail(emailValue);
  if (!email || !record || record.status === "spam") return false;
  if (normalizeWorkspaceEmail(record.email) === email) return record.workspacePrimaryAccess?.status !== "revoked";
  return Array.isArray(record.workspaceContacts) && record.workspaceContacts.some((contact) => contact?.status === "active" && normalizeWorkspaceEmail(contact.email) === email);
}

export function activeWorkspaceContacts(record) {
  return Array.isArray(record?.workspaceContacts) ? record.workspaceContacts.filter((contact) => contact?.status === "active" && normalizeWorkspaceEmail(contact.email)) : [];
}
