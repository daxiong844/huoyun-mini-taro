// 统一读取应用层全局配置
// 来源：config/dev.ts / config/prod.ts 中的 env 注入

const rawHost = null; //process.env.API_HOST
const rawUseMock = "true"; //process.env.USE_MOCK

export const API_HOST: string = rawHost || "http://localhost:3000";
export const USE_MOCK: boolean = String(rawUseMock).toLowerCase() === "true";

// 可选：暴露一个运行时可切换的方法（仅在 H5/开发时有用）
// 运行时覆盖值（避免依赖 globalThis，在小程序端可能不存在）
let runtimeUseMockOverride: boolean | undefined;

export function setUseMock(value: boolean) {
  // 注意：这只是运行时变量，不会改变打包注入的 env
  runtimeUseMockOverride = value;
}

export function isUseMock(): boolean {
  if (typeof runtimeUseMockOverride === "boolean")
    return runtimeUseMockOverride;
  return USE_MOCK;
}
