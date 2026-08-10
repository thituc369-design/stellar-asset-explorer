export const HORIZON_URL = "https://horizon-testnet.stellar.org";

export interface AssetSummary {
  asset_type: string;
  asset_code: string;
  asset_issuer: string;
  amount: string;
  num_accounts: number;
  paging_token: string;
}

export interface AssetHoldersResponse {
  _embedded: {
    records: AssetHolder[];
  };
}

export interface AssetHolder {
  account_id: string;
  amount: string;
  asset_type: string;
  asset_code: string;
  asset_issuer: string;
  last_modified_ledger?: number;
  sponsor?: string;
}

export async function fetchAsset(
  code: string,
  issuer: string,
  signal?: AbortSignal,
): Promise<AssetSummary | null> {
  const params = new URLSearchParams({
    asset_code: code,
    asset_issuer: issuer,
    limit: "1",
  });
  const res = await fetch(`${HORIZON_URL}/assets?${params.toString()}`, { signal });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Horizon returned ${res.status}`);
  const data = (await res.json()) as { _embedded?: { records: AssetSummary[] } };
  const record = data._embedded?.records[0];
  return record ?? null;
}

export async function fetchHolders(
  code: string,
  issuer: string,
  signal?: AbortSignal,
): Promise<AssetHolder[]> {
  const params = new URLSearchParams({
    asset: `${code}-${issuer}`,
    limit: "20",
    order: "desc",
  });
  const res = await fetch(`${HORIZON_URL}/accounts?${params.toString()}`, { signal });
  if (!res.ok) throw new Error(`Horizon returned ${res.status}`);
  const data = (await res.json()) as AssetHoldersResponse;
  return data._embedded.records;
}