// Simple profanity filter for 3-letter initials
// Checks against common offensive 3-letter combinations
const BLOCKED = new Set([
  'ASS','FUK','FUC','FCK','FAG','FAT','FKU','KKK','KYS',
  'NIG','NGA','NGR','SEX','SHT','SHI','TIT','WTF','STF',
  'CUM','COK','COC','DIK','DIC','CNT','CUN','PUS','VAG',
  'GAY','JEW','GOD','DMN','SUK','SUC','HOR','HOE','BIT',
  'ARS','NUT','PEN','ANL','ANS','RAP','RIM','JIZ','JIS',
]);

export function isClean(initials) {
  if (!initials || initials.length !== 3) return false;
  const upper = initials.toUpperCase().replace(/[^A-Z]/g, '');
  if (upper.length !== 3) return false;
  return !BLOCKED.has(upper);
}

export function sanitize(initials) {
  const upper = (initials || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
  return upper.padEnd(3, 'A');
}
