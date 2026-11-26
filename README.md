# Magpie Agent for Vetta

为 [Vetta Desktop](https://github.com/openvetta/open-vetta) 提供 Magpie Agent 集成。Magpie 可用 Vetta 的名称和图标识别该 Agent，并通过 Library 向 Vetta 分发全局指令、MCP 服务器和 Skills。

## 功能

- 使用 Vetta 官方图标，并内嵌在插件中；显示图标不依赖网络。
- 将 Magpie Library 的全局指令写入 Vetta 的 `AGENTS.md`。
- 将 MCP 服务器和 Skills 分发到 Vetta 的默认 Agent 目录。
- 为 Vetta 注册专属识别标记，供 Magpie 区分来自 Vetta 的请求。
- 沿用 Magpie 的资源分配、冲突处理和撤回机制。

该插件只负责 Agent 身份和 Library 资源，不配置模型账号或接管模型路由。请在 Vetta 中使用其内置的 Magpie Provider 配置模型连接。

## 安装

发布到 Magpie 插件目录后，可在 Magpie 的插件发现页搜索 **Vetta** 并安装。源码本地安装可使用：

```sh
pnpm install --frozen-lockfile
pnpm build
magpie plugin add .
```

## 配置

在 Magpie 的 Library 页面选择 Vetta 作为资源接收方：

| Library 资源 | Vetta 路径                 |
| ------------ | -------------------------- |
| 全局指令     | `~/.vetta/agent/AGENTS.md` |
| MCP 服务器   | `~/.vetta/agent/mcp.json`  |
| Skills       | `~/.vetta/agent/skills/`   |

MCP 使用 `mcpServers` 配置格式。资源由 Magpie Library 管理；通过 Magpie 撤回分配后，插件不再向 Vetta 提供对应资源。

### 请求识别

Magpie 按请求的 `User-Agent` 识别客户端。Vetta 0.6.27 及以上版本会自动为内置 Magpie Provider 带上 `User-Agent: Vetta`：新启用时直接写入，之前已启用的配置会在 Vetta 启动时自动补上，无需手动修改；已自行设置过 `User-Agent` 的不会被覆盖。

使用 0.6.27 之前的 Vetta 时，需要在 `~/.vetta/agent/models.json` 的 `providers.magpie.headers` 中手动合并以下配置，或升级到最新版 Vetta：

```json
{
  "providers": {
    "magpie": {
      "headers": {
        "User-Agent": "Vetta"
      }
    }
  }
}
```

将此字段合并到现有配置中，不要用示例覆盖整个 `models.json`。新请求会按 Vetta 识别；历史请求不会自动重新归类。

## 兼容性

需要 Vetta 0.6.27 及以上版本才能自动被 Magpie 识别；更早的版本请按上文「请求识别」手动配置。

插件使用 Vetta 默认目录 `~/.vetta/agent`。旧目录和自定义目录需要由用户自行迁移或管理。当前已在 Windows 上验证 Magpie 插件加载和 Vetta Library 资源分发；macOS、Linux 和其他 Vetta 启动配置尚未验证。

## 许可证

本项目采用 [MIT License](LICENSE)。Vetta 图标取自 Vetta Desktop 仓库的 `apps/desktop/src/renderer/public/icon.png`，来源代码版本为 [`1793f66`](https://github.com/openvetta/open-vetta/tree/1793f66d177a5cb30b7b4e0e6593eacce69d513c)，遵循其 MIT 许可证。
