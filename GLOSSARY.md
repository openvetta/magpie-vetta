# Magpie 与 Vetta 集成

本项目让 Magpie 识别 Vetta，并向 Vetta 提供由 Magpie Library 统一管理的能力。

## Language

**Agent 插件**：
向 Magpie 声明 Vetta 身份及可接收资源的集成包。
_Avoid_: 模型供应商插件、Vetta 智能体实现

**资源分配**：
用户在 Magpie Library 中决定哪些 MCP 服务器或 Skills 提供给 Vetta 的关系。
_Avoid_: 全量复制、模型同步

**MCP 工具使用**：
Vetta 发现并执行被分配的 MCP 服务器工具的能力。
_Avoid_: 工具调用统计

**会话统计**：
在 Magpie 中按 Vetta 会话归集请求与用量的信息。
_Avoid_: 导入历史、启动管理

**调用记录**：
描述一次工具调用及其执行情况的信息。
_Avoid_: MCP 工具使用
