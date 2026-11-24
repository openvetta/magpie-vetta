# 首版接入的源码核查

日期：2026-11-24。方法：GitHub CLI 只读获取源码；未执行上游代码或插件。此文为静态核查，不替代集成验收。

固定版本：

- Magpie：`95e6a4180866afde186e0f1a25369388c7fd7e7f`。
- Vetta：`8d7502ca80fa098118959245647ad32140dc6378`。

## 注册与模型接入的分离

Magpie 要求 Agent 描述包含 config，并至少声明 model 或 connect；Library target 的生成不要求 Agent 已连接模型。无 model/startup 时仍会显示 provider 开关。空 connect 虽能满足模块加载要求，却会在开关启用时失败，因此不可当成完成的接入方案。

候选工程方案为插件维护独立状态配置，满足宿主注册契约而不写 Vetta 模型设置；其 UI 语义、连接输出和卸载行为需进一步设计和验证。若无法在现有契约内提供清晰行为，再讨论 Magpie 上游 Library-only 支持。

证据：[agentplug.go#L422](https://github.com/yetone/magpie/blob/95e6a4180866afde186e0f1a25369388c7fd7e7f/internal/agentplug/agentplug.go#L422)、[plugged.go#L543](https://github.com/yetone/magpie/blob/95e6a4180866afde186e0f1a25369388c7fd7e7f/internal/agent/plugged.go#L543)、[plugged.go#L784](https://github.com/yetone/magpie/blob/95e6a4180866afde186e0f1a25369388c7fd7e7f/internal/agent/plugged.go#L784)、[targets.go#L755](https://github.com/yetone/magpie/blob/95e6a4180866afde186e0f1a25369388c7fd7e7f/internal/library/targets.go#L755)。

## 数据目录

Vetta 数据根优先 VETTA_HOME，否则为用户目录下的 VETTA_CONFIG_DIR（默认 .vetta）。Agent 根优先 VETTA_CODING_AGENT_DIR，否则为数据根下 agent。项目目录固定使用 .vetta，不跟随 VETTA_CONFIG_DIR。

Desktop MCP runtime 使用 agentDir/mcp.json，但设置 UI 使用数据根下 agent/mcp.json；自定义 Agent 根可能导致两者不一致。Skills 原生扫描根包含 agentDir/skills，市场资源根另为数据根下 skills。

因此默认候选为已解析 agentDir 下的 MCP 和 Skills，环境覆盖需同时考虑 Magpie 与 Vetta 启动时可见的环境可能不同。仅在 Magpie 进程中展开一个变量，不能证明它等于正在运行的 Vetta 使用的目录。

自动发现是可行的工程方向，尚未实现或验证：先检查上述配置与默认位置，再利用能够可靠获取的运行/启动关联信息补充候选，并校验目录身份。只拿到安装目录或仅发现一个旧 mcp.json 不足以认定当前资源目录。静态 Agent 描述是否足够完成动态路径选择仍需核查；若需要，应在独立插件内部实现发现适配，不默认修改上游。

证据：[endpoint-file.ts#L27](https://github.com/openvetta/open-vetta/blob/8d7502ca80fa098118959245647ad32140dc6378/packages/action-rpc/src/endpoint-file.ts#L27)、[node-config.ts#L152](https://github.com/openvetta/open-vetta/blob/8d7502ca80fa098118959245647ad32140dc6378/packages/coding-agent/src/host/node-config.ts#L152)、[mcp-supervisor.ts#L81](https://github.com/openvetta/open-vetta/blob/8d7502ca80fa098118959245647ad32140dc6378/apps/desktop/src/main/agent-runtime/mcp-supervisor.ts#L81)、[resource-runtime.ts#L147](https://github.com/openvetta/open-vetta/blob/8d7502ca80fa098118959245647ad32140dc6378/apps/desktop/src/main/agent-runtime/resource-runtime.ts#L147)。

## MCP 格式

Magpie claude 格式 HTTP 输出包含显式 type=http、url 和可选 headers；Vetta 接受这些字段，transport 会传递 headers。只含 url 而没有 type 的对象不等价，不能省略 type。SSE 在 Vetta 中需要注意 protocolMode 限制，不能将 HTTP 形状匹配泛化为所有 transport 已兼容。

原生项目和全局同名 MCP 以字段浅合并；兼容项目 .mcp.json 与原生项目配置同名时，则原生条目整项替换兼容条目。

证据：[Magpie mcp.go#L373](https://github.com/yetone/magpie/blob/95e6a4180866afde186e0f1a25369388c7fd7e7f/internal/library/mcp.go#L373)、[Vetta schemas.ts#L34](https://github.com/openvetta/open-vetta/blob/8d7502ca80fa098118959245647ad32140dc6378/packages/runtime-mcp/src/config/schemas.ts#L34)、[http-mcp-client.ts#L123](https://github.com/openvetta/open-vetta/blob/8d7502ca80fa098118959245647ad32140dc6378/packages/runtime-node/src/mcp/transports/http/http-mcp-client.ts#L123)、[file-config-source.ts#L137](https://github.com/openvetta/open-vetta/blob/8d7502ca80fa098118959245647ad32140dc6378/packages/runtime-node/src/mcp/config/file-config-source.ts#L137)。

## 刷新与轮次

Skills 会话资源以 fingerprint 检测变化，在轮次 admission 捕获资源；已有轮次保持旧快照。Desktop Skill 列表查询会重建 loader 并 reload。

MCP tool source 的 refresh 会调用 reloadIfChanged，配置 signature 变化后 diff reconcile。底层支持刷新，但尚未完整验证 Desktop 每次轮次到该 source 的调用链，不能承诺写盘立即生效。

证据：[session-resource-runtime.ts#L253](https://github.com/openvetta/open-vetta/blob/8d7502ca80fa098118959245647ad32140dc6378/packages/coding-agent/src/resources/runtime/session-resource-runtime.ts#L253)、[admitted-prompt-resources.ts#L35](https://github.com/openvetta/open-vetta/blob/8d7502ca80fa098118959245647ad32140dc6378/packages/coding-agent/src/composition/turn/admitted-prompt-resources.ts#L35)、[server-runtime-tool-source.ts#L39](https://github.com/openvetta/open-vetta/blob/8d7502ca80fa098118959245647ad32140dc6378/packages/runtime-mcp/src/tools/server-runtime-tool-source.ts#L39)、[supervisor.ts#L149](https://github.com/openvetta/open-vetta/blob/8d7502ca80fa098118959245647ad32140dc6378/packages/runtime-mcp/src/server/supervisor.ts#L149)。

## Skills 与 Skill router

普通名称符号链接可被发现；Vetta 会跟随链接，并按 realPath 避免循环和重复加载。缺少 description 的 Skill 会被丢弃，同名 Skill 先发现者优先。

扫描器跳过隐藏子目录，包括 router 内部 .skills。Magpie Skill router 本来就通过可见 magpie-skills/SKILL.md 列表引导按需读取内部 Skill，避免每项描述都进入初始提示；隐藏目录不递归发现符合这一设计。尚须实测 Vetta 加载路由正文后能读取列出的隐藏路径、相对资源并执行获准脚本，不应仅因扫描器跳过隐藏项就宣布不兼容，也不应把内部目录全部展开来绕过路由。

证据：[Vetta discovery.ts#L170](https://github.com/openvetta/open-vetta/blob/8d7502ca80fa098118959245647ad32140dc6378/packages/coding-agent/src/resources/skills/discovery.ts#L170)、[discovery.ts#L241](https://github.com/openvetta/open-vetta/blob/8d7502ca80fa098118959245647ad32140dc6378/packages/coding-agent/src/resources/skills/discovery.ts#L241)、[Magpie Skill router 文档](https://github.com/yetone/magpie/blob/95e6a4180866afde186e0f1a25369388c7fd7e7f/docs/subsystems/skill-router.md)。

## 接管与卸载

MCP/Skills 的接管、冲突和撤回采用 Magpie 原生语义，具体证据集中在 requirements.md。卸载 Agent 插件不等价于撤回 Library 分发；当前源码未证明有自动清理保证。集成验收须覆盖先撤回分发再卸载，并记录结果。

## 插件市场发现与安装的补充核查

2026-11-24 追加读取上游当时 main 分支，以下补充证据未固定为前述旧快照：

- [Magpie GitHub 插件发现实现](https://github.com/yetone/magpie/blob/main/internal/plugin/github.go) 使用 magpie-plugin topic 发现公开仓库，区分 Agent 类型；归档、fork 及部分无效包会被排除。匹配到可用 npm 包时从 npm 安装，否则可从 GitHub 来源安装。发现依赖 GitHub 索引及缓存刷新，并非发布后立即可见。
- [社区插件市场说明](https://github.com/magpie-community/plugins#the-market) 描述 registry 目录收录方式，需新增条目并提交 PR；声明 magpie.agent 的包属于 agent，是否包含 main 不改变该身份。

因此“市场可搜索下载”存在社区发现与官方目录两条路径；公开可发现不等于官方目录已收录，也不能用本地安装成功替代真实搜索和界面安装验收。实施时需固定实际版本并重新确认这些发现规则。
