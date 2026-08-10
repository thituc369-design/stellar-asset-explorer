import "./style.css";
import { mountApp } from "./app";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("#app root missing");
mountApp(root);