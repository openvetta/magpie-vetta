# Magpie Agent Vetta 需求基线

更新日期：2026-11-24。
状态：首版主要需求已逐项确认。本文记录产品要求、源码证据与待验证实现；不代表插件已实现或兼容性已验证。

## 目标

通过一个可安装的 Magpie Agent 插件，让 Magpie 识别 Vetta，并让 Vetta 使用 Magpie Library 统一管理的 MCP 与 Skills。

模型接入沿用 Vetta 自带的 Magpie 预设。插件的核心价值是 Agent 身份和 Library 资源对接。

## 已确认范围

| 编号 | 需求 | 验收方向 |
| --- | --- | --- |
| R1 | Magpie 识别 Vetta | 安装插件后，Agents 页面能够显示 Vetta；优先自动发现并校验实际数据目录，覆盖默认及自定义目录的设计与验收 |
| R2 | 使用统一管理的 MCP | 在 Library 分配服务器后，Vetta 能发现并调用其工具；取消分配后，经约定的刷新操作停止提供该资源 |
| R3 | 使用统一管理的 Skills | 在 Library 分配 Skill 后，Vetta 能发现并加载正文及附带资源；取消分配后，经约定的刷新操作停止提供该资源 |
| R4 | 沿用 Vetta 原生模型接入 | 插件不接管模型列表、默认模型和模型供应商配置 |
| R5 | 独立安装交付 | 安装插件即可接入受支持版本，无需修改或重新编译 Magpie、Vetta |
| R6 | 市场可发现与安装 | 项目公开发布后，用户在受支持 Magpie 的插件发现/搜索界面能找到 Vetta Agent 插件，并通过界面下载安装；不能只以本地目录安装成功代替 |

用户于 2026-11-24 确认：首版聚焦 R1–R3 及 R4 的边界；会话统计与调用记录保留到后续阶段。MCP 工具的实际执行属于首版，不能因调用记录延期而移出首版。

用户于 2026-11-24 确认首版必测目标为 Windows 上的 Vetta Desktop。CLI、macOS 和 Linux 在分别验证后再承诺正式支持；设计尽量复用跨平台路径规则，但这不等于已通过跨平台验收。最低兼容版本尚待源码核查和集成验证确定。

资源接管、分配和冲突复用 Magpie 原生 Library 机制，用户于 2026-11-24 回复“确认”。用户指出 Magpie 已提供统一管理选择后，撤回此前提出的独立“用户原有项永远优先”策略问题。插件不重复建设资源管理界面，也不承诺改变宿主的覆盖和撤回语义。

用户于 2026-11-24 确认资源生效边界：以新会话能读取最新 MCP/Skills 为保底验收，利用已有刷新能力尽量让后续轮次生效；正在执行的轮次允许持有原资源快照，不要求中途替换。此边界适用于增加和取消分配；取消分配不承诺即时终止已经开始的调用。

用户于 2026-11-24 确认独立插件交付边界（R5）。宿主注册契约适配应在插件内部完成。若必须修改任一上游源码才能满足目标，应先说明具体限制并重新讨论，不将修改或重新编译上游作为默认安装步骤。

用户随后明确最终交付应可在 Magpie 插件界面搜索并下载安装（R6）。该要求补充原有独立安装目标，不表示当前已经发布、已经进入官方目录或可以立即搜索到。

用户于 2026-11-24 确认自动目录发现方案：首选自动检查有依据的候选位置并校验，避免常规安装步骤要求用户手填路径；唯一可信候选自动使用，找不到或多个有效候选时提供选择/指定路径兜底。候选来源包括可用环境配置、默认目录及能可靠获得的 Vetta 运行/启动信息。默认目录、自定义数据根、自定义 Agent 根、旧目录残留和多候选均需纳入验收。不能承诺发现任意位置，也不能仅凭某目录存在就对其写入。

## 已排除范围

- 启动 Vetta、托管 Vetta 进程。
- 重复实现 Vetta 已有的 Magpie 模型发现与配置。
- 当前阶段编写插件代码、安装插件或修改用户运行中的 Vetta/Magpie 配置。

## 已查到的源码事实

### Magpie 支持 Agent 插件

[internal/agentplug/agentplug.go](https://github.com/yetone/magpie/blob/main/internal/agentplug/agentplug.go) 支持 Agent 描述及可选的 `library.mcp`、`library.mcpFormat`、`library.skills`。社区插件在 `package.json` 的 `magpie.agent` 指向描述文件。

早期调研根据 integrating 文档得出了“只能提交内置 adapter”的结论；该结论与 Agent 插件实现和社区实例不符，已撤回。后续以实际宿主实现及所支持版本为准。

### Vetta 已有 Magpie 模型预设

[catalog.ts](https://github.com/openvetta/open-vetta/blob/main/apps/desktop/src/main/models/presets/catalog.ts) 声明 `id: "magpie"`、默认地址 `http://127.0.0.1:3425/v1`、默认密钥 `magpie`，使用 OpenAI-compatible 模型获取逻辑。

[fetch.test.ts](https://github.com/openvetta/open-vetta/blob/main/apps/desktop/src/main/models/presets/fetch.test.ts) 包含 Magpie 预设和模型能力字段测试。此处为静态源码查阅，没有在本地运行上游测试。

### Vetta 的 MCP 入口

[MCP 文档](https://github.com/openvetta/open-vetta/blob/main/packages/coding-agent/docs/MCP.md) 记录：全局配置 `~/.vetta/agent/mcp.json`，项目配置 `<cwd>/.vetta/mcp.json`，顶层结构为 `mcpServers`，项目同名项覆盖全局项，并支持 HTTP MCP。

Magpie 的 `claude` MCP 格式是候选映射。顶层结构匹配不等于所有字段已兼容；HTTP transport、headers 和启用/禁用等字段仍需逐项验证。

### Vetta 的 Skills 入口

[Skills 文档](https://github.com/openvetta/open-vetta/blob/main/packages/coding-agent/docs/skills.md) 列出 `~/.vetta/agent/skills/` 等发现目录。

[discovery.ts](https://github.com/openvetta/open-vetta/blob/main/packages/coding-agent/src/resources/skills/discovery.ts) 对符号链接调用 stat 后继续遍历，通过 realPath 去重，并保存 Skill 的 baseDir。源码支持“链接可被发现”的判断；附带脚本执行、相对资源读取与权限仍需要集成验收。

## 候选方案，尚未定案

优先尝试轻量 Agent 描述文件，声明 Vetta 身份和专属 Library 路径，复用 Magpie 宿主的分发与撤回机制。

候选 MCP 路径为 `~/.vetta/agent/mcp.json`，Skills 路径为 `~/.vetta/agent/skills/`。不使用共享 `~/.agents/skills/` 作为插件专属写入目标，避免资源分配意外影响其他 Agent；此为建议，仍需依据宿主行为验证。

Magpie 固定快照核查发现：`config` 必填，且 `model` 或 `connect` 至少有一个；没有原生 Library-only 插件声明。Library target 自身不依赖是否已接通模型，因此资源分配不必绑定模型接管。无 model/startup 的插件会显示 provider 开关，但空 connect 在用户开启时会报错。实现方案需处理这一宿主约束，不能以空 connect 伪装一个完整可用的开关。

证据：[agentplug.go，第 422 行起](https://github.com/yetone/magpie/blob/95e6a4180866afde186e0f1a25369388c7fd7e7f/internal/agentplug/agentplug.go#L422)、[Library target，第 755 行起](https://github.com/yetone/magpie/blob/95e6a4180866afde186e0f1a25369388c7fd7e7f/internal/library/targets.go#L755)、[connect 空返回检查，第 543 行起](https://github.com/yetone/magpie/blob/95e6a4180866afde186e0f1a25369388c7fd7e7f/internal/agent/plugged.go#L543)。

只有宿主现有机制不能满足资源对接时，才讨论额外运行时或 Vetta 侧修改。

## 后续验收场景

1. 安装后自动识别并校验 Vetta 目录；覆盖默认位置、自定义数据根、自定义 Agent 根、旧目录残留和多个候选。无有效证据时不错误写入；无法确定时按最终约定请求选择或指定路径。
2. 分配一个 stdio MCP 和一个 HTTP MCP，Vetta 都能执行真实工具调用。
3. 同名项目 MCP 覆盖全局配置时，表现符合明确的冲突策略。
4. 分配一个带附属文件的 Skill，验证发现、正文加载、相对资源与脚本访问。
5. 打开和关闭 Magpie MCP router、Skill router，分别验证实际兼容性。
6. 取消分配、断开或卸载，验证撤回机制；用户原有及手动修改的内容按确定的保留策略处理。
7. 增加或取消分配后，新会话读取最新资源状态；验证后续轮次的刷新行为。正在执行的轮次不要求中途切换资源，也不提前承诺写盘立即生效。

## Magpie 原生接管和撤回行为

以下是固定快照 `95e6a4180866afde186e0f1a25369388c7fd7e7f` 的源码行为，尚未执行集成测试。

- claude 格式的同名 MCP：Library 合并条目并管理 type/url/headers/command/args/env 等核心字段，保留其他用户字段。因此主动分配并不代表“遇到原有项自动跳过”。[mcp.go，第 1431 行起](https://github.com/yetone/magpie/blob/95e6a4180866afde186e0f1a25369388c7fd7e7f/internal/library/mcp.go#L1431)、[第 1533 行起](https://github.com/yetone/magpie/blob/95e6a4180866afde186e0f1a25369388c7fd7e7f/internal/library/mcp.go#L1533)。
- 已应用 MCP 取消分发：按 Applied 名称删除整个条目，不对当前内容做“用户是否改过”的比较；写前有文件备份。不得承诺自动恢复接管前的同名项。[sync.go，第 262 行起](https://github.com/yetone/magpie/blob/95e6a4180866afde186e0f1a25369388c7fd7e7f/internal/library/sync.go#L262)。
- 同名不同内容 Skill：保留原目录并报告 Own 冲突，由现有机制提供取舍；选 Library 版本时备份原目录，选保留原 Skill 时取消该目标分发。[skills.go，第 930 行起](https://github.com/yetone/magpie/blob/95e6a4180866afde186e0f1a25369388c7fd7e7f/internal/library/skills.go#L930)、[第 2370 行起](https://github.com/yetone/magpie/blob/95e6a4180866afde186e0f1a25369388c7fd7e7f/internal/library/skills.go#L2370)。
- Skill 取消分发：只移除宿主能识别为自身管理的链接或副本。[skills.go，第 804 行起](https://github.com/yetone/magpie/blob/95e6a4180866afde186e0f1a25369388c7fd7e7f/internal/library/skills.go#L804)。
- 移除/关闭 Agent 插件与撤回 Library 资源是不同操作；当前调用链只明确恢复 Agent config/startup。高置信源码推导为：卸载后 target 消失，不能指望常规同步自动清除旧资源。首版使用说明应先要求在 Library 撤回资源并确认，再卸载，除非后续验证或上游能力明确提供自动清理。[plugged_gone.go，第 30 行起](https://github.com/yetone/magpie/blob/95e6a4180866afde186e0f1a25369388c7fd7e7f/internal/agent/plugged_gone.go#L30)、[targets.go，第 1045 行起](https://github.com/yetone/magpie/blob/95e6a4180866afde186e0f1a25369388c7fd7e7f/internal/library/targets.go#L1045)。

## 证据限制

前述证据来自前续对 GitHub main 分支的只读查阅，链接可能随上游变化。后续调研开始固定源码快照：Vetta `8d7502ca80fa098118959245647ad32140dc6378`；本轮查询 Magpie main 为 `95e6a4180866afde186e0f1a25369388c7fd7e7f`，具体核查结论仍须注明其对应快照。当前未运行插件，没有完成端到端验证。

Windows Desktop 的补充核查发现：Vetta MCP runtime 读取 `agentDir/mcp.json`，而 MCP 设置界面写入 `getVettaHomePath()/agent/mcp.json`；Skills 管理界面使用 `getVettaHomePath()/skills`。因此需要继续核实实际 agentDir 来源和资源发现规则，不能把默认目录当成所有启动方式下的固定目录。

证据（Vetta 固定快照）：[MCP supervisor，第 81 行起](https://github.com/openvetta/open-vetta/blob/8d7502ca80fa098118959245647ad32140dc6378/apps/desktop/src/main/agent-runtime/mcp-supervisor.ts#L81)、[MCP settings service，第 43 行](https://github.com/openvetta/open-vetta/blob/8d7502ca80fa098118959245647ad32140dc6378/apps/desktop/src/main/mcp/mcp-settings-service.ts#L43)。
