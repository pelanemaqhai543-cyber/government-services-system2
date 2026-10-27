function yearsBetween(dob, now = new Date()) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d)) return null;
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}
function requiredDocTypes(row) {
  try { return JSON.parse(row.required_documents || '[]'); } catch { return []; }
}
function presentDocTypes(documents) {
  return new Set((documents || []).map(d => d.document_type));
}
module.exports = { yearsBetween, requiredDocTypes, presentDocTypes };
