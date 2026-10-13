import {viteEnv} from "../viteEnv";

const env = viteEnv();

export const MAP_TILE_URL = env.VITE_MAP_TILE_URL
    || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const MAP_ATTRIBUTION = env.VITE_MAP_ATTRIBUTION
    || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
