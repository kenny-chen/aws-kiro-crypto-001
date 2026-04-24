export function isAdmin(walletAddress: string | null): boolean {
  if (!walletAddress) return false;
  const admins = (process.env.ADMIN_WALLET_ADDRESSES ?? "").split(",").map((s) => s.trim());
  return admins.includes(walletAddress);
}
