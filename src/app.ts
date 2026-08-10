import { fetchAsset, fetchHolders, type AssetHolder, type AssetSummary } from "./api";

interface State {
  code: string;
  issuer: string;
  loading: boolean;
  error: string | null;
  asset: AssetSummary | null;
  holders: AssetHolder[];
}

const initialState: State = {
  code: "",
  issuer: "",
  loading: false,
  error: null,
  asset: null,
  holders: [],
};

const state: State = { ...initialState };

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Partial<Record<string, string>> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined && value !== null) node.setAttribute(key, String(value));
  }
  for (const child of children) {
    node.append(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

function fmtAmount(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 7 });
}

function renderStatus(state: State): HTMLElement | null {
  if (!state.loading && !state.error) return null;
  if (state.loading) {
    return el("div", { class: "status loading" }, ["Fetching from Horizon testnet…"]);
  }
  return el("div", { class: "status error" }, [`Error: ${state.error}`]);
}

function renderResults(state: State): HTMLElement | null {
  if (state.loading || state.error || !state.asset) return null;

  const wrap = el("div", { class: "results" });

  const summary = el("div", { class: "summary" }, [
    el("div", { class: "stat" }, [
      el("div", { class: "label" }, ["Asset Code"]),
      el("div", { class: "value mono" }, [state.asset.asset_code]),
    ]),
    el("div", { class: "stat" }, [
      el("div", { class: "label" }, ["Issuer"]),
      el("div", { class: "value mono" }, [state.asset.asset_issuer]),
    ]),
    el("div", { class: "stat" }, [
      el("div", { class: "label" }, ["Total Supply"]),
      el("div", { class: "value" }, [fmtAmount(state.asset.amount)]),
    ]),
    el("div", { class: "stat" }, [
      el("div", { class: "label" }, ["Holders"]),
      el("div", { class: "value" }, [String(state.asset.num_accounts)]),
    ]),
  ]);

  wrap.appendChild(summary);

  wrap.appendChild(el("h2", { class: "section-title" }, ["Top holders"]));

  if (state.holders.length === 0) {
    wrap.appendChild(el("div", { class: "empty" }, ["No holders found for this asset."]));
    return wrap;
  }

  const table = el("table");
  const thead = el("thead", {}, [
    el("tr", {}, [
      el("th", {}, ["Account"]),
      el("th", {}, ["Balance"]),
      el("th", {}, ["Last Ledger"]),
    ]),
  ]);
  const tbody = el("tbody");
  for (const h of state.holders) {
    const tr = el("tr", {}, [
      el("td", { class: "mono" }, [h.account_id]),
      el("td", {}, [fmtAmount(h.amount)]),
      el("td", { class: "mono" }, [h.last_modified_ledger ? String(h.last_modified_ledger) : "—"]),
    ]);
    tbody.appendChild(tr);
  }
  table.append(thead, tbody);
  wrap.appendChild(table);

  return wrap;
}

function renderApp(root: HTMLDivElement, state: State): void {
  root.innerHTML = "";

  const app = el("div", { class: "app" });

  const header = el("header", { class: "header" }, [
    el("h1", {}, ["Stellar Asset Explorer"]),
    el("p", {}, ["Look up an asset on the Stellar testnet via Horizon"]),
  ]);

  const card = el("div", { class: "card" });

  const form = el("form", { id: "lookup-form" }, [
    el("label", { for: "code" }, ["Asset code"]),
    el("input", { id: "code", name: "code", placeholder: "e.g. XLM or USDC", required: "true" }),
    el("label", { for: "issuer" }, ["Issuer public key (G…)"]),
    el("input", {
      id: "issuer",
      name: "issuer",
      placeholder: "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
      required: "true",
    }),
    el("button", { type: "submit" }, ["Look up asset"]),
    el("p", { class: "hint" }, [
      "Testnet only. Use any known testnet asset code and issuer public key.",
    ]),
  ]);

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const formData = new FormData(form);
    const code = String(formData.get("code") ?? "").trim();
    const issuer = String(formData.get("issuer") ?? "").trim();
    Object.assign(state, {
      code,
      issuer,
      loading: true,
      error: null,
      asset: null,
      holders: [],
    });
    renderApp(root, state);
    void runLookup(root, state);
  });

  card.appendChild(form);
  card.appendChild(el("div", { id: "status" }, []));
  card.appendChild(el("div", { id: "results" }, []));

  app.append(header, card);
  root.appendChild(app);

  const statusEl = root.querySelector<HTMLDivElement>("#status");
  const resultsEl = root.querySelector<HTMLDivElement>("#results");

  const statusNode = renderStatus(state);
  if (statusEl && statusNode) statusEl.replaceWith(statusNode);
  const resultsNode = renderResults(state);
  if (resultsEl && resultsNode) resultsEl.replaceWith(resultsNode);
}

async function runLookup(root: HTMLDivElement, state: State): Promise<void> {
  try {
    const [asset, holders] = await Promise.all([
      fetchAsset(state.code, state.issuer),
      fetchHolders(state.code, state.issuer),
    ]);
    if (!asset) {
      Object.assign(state, {
        loading: false,
        error: `Asset "${state.code}" not found on testnet.`,
      });
    } else {
      Object.assign(state, { loading: false, error: null, asset, holders });
    }
  } catch (err) {
    Object.assign(state, {
      loading: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
  renderApp(root, state);
}

export function mountApp(root: HTMLDivElement): void {
  renderApp(root, state);
}