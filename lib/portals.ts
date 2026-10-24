export const guestOrigin = (
  process.env.NEXT_PUBLIC_GUEST_URL || "http://localhost:3000"
).replace(/\/$/, "");
export const managementOrigin = (
  process.env.NEXT_PUBLIC_MANAGEMENT_URL || "http://localhost:3001"
).replace(/\/$/, "");

export function guestLink(path = "/") {
  return `${guestOrigin}${path}`;
}
export function managementLink(path = "/") {
  return `${managementOrigin}${path}`;
}
