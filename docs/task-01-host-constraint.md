# 任务 01：宿主接口核查与待决限制

日期：2026-11-25。核查对象为 Magpie 源码 `95e6a4180866afde186e0f1a25369388c7fd7e7f` 和 Vetta 源码 `8d7502ca80fa098118959245647ad32140dc6378`；它们是源码快照，不是已验证的发行版本。本机 Magpie 报告版本 `0.1.4762`，尚未建立该版本与源码快照的对应关系。

## 本机隔离实验

2026-11-25 使用已安装的 Magpie `0.1.4762`，通过独立的 HOME、XDG 配置与缓存目录进行了实验，没有使用真实用户的 Library 或 Vetta 配置。创建一个本地 Agent 插件，声明独立状态文件和默认形状的 `~/.vetta/agent/mcp.json`，并预先在隔离目录中创建状态文件：

1. `magpie plugin add <本地插件目录>` 成功；查询该 Agent 显示 `Vetta Probe`。
2. `magpie library mcp add vetta-probe-tool node --version agents=vetta-probe --local` 成功，隔离目录的 MCP 文件出现包含 `type: stdio`、`command: node` 和参数 `--version` 的条目。
3. `magpie library mcp agents vetta-probe-tool none` 成功，MCP 文件中的该条目消失。

这验证了实际发行版能加载插件并按声明路径分发和撤回配置，也验证了仅有插件状态文件即可让宿主接受该测试目标。`node --version` 仅是配置写入探针，不是 MCP 服务器；实验没有启动 Vetta 或验证工具执行。实验中没有真实 Vetta 安装或运行时身份证据，因此也不能据此确认目标为真实 Vetta。上游还有 [Agent 插件 Library 测试](https://github.com/yetone/magpie/blob/95e6a4180866afde186e0f1a25369388c7fd7e7f/internal/library/agent_plugin_test.go)，覆盖分发与保留自有条目。

本机发现 Vetta 安装于 `D:\Program Files\Vetta`，安装器文件版本为 `0.6.19`，且默认用户数据目录存在；实验时未发现运行中的 Vetta 进程。安装及目录存在仍不能单独确认当前实例的实际 Agent 目录。Vetta 源码的 [`getAgentDir`](https://github.com/openvetta/open-vetta/blob/8d7502ca80fa098118959245647ad32140dc6378/packages/coding-agent/src/host/node-config.ts) 优先使用 `VETTA_CODING_AGENT_DIR`，否则使用数据根下的 `agent`；[Desktop MCP supervisor](https://github.com/openvetta/open-vetta/blob/8d7502ca80fa098118959245647ad32140dc6378/apps/desktop/src/main/agent-runtime/mcp-supervisor.ts) 从该目录的 `mcp.json` 加载全局配置。

随后用本项目构建产物和 `tests/fixtures/probe-mcp.mjs` 重复实验：Magpie 成功注册 Vetta，分配时写入测试服务器的 stdio 配置，撤回后该条目消失。直接向测试服务器发送 MCP `initialize`、`tools/list` 和 `tools/call` 请求，得到 `probe-ok: hello`；这是服务器自身的协议检查，并非 Vetta 的调用。隔离环境启动 Vetta `0.6.19` 两次，进程均退出且未出现窗口，日志只显示启动信息，原因尚未确定。因此尚无 Vetta 加载或实际调用的证据。实验目录已移除。

插件的 `dir` 指向 `~/.vetta/agent`，以收窄宿主目录发现的范围；这仍无法区分旧目录和当前运行实例。不能将 Vetta 的模型文件作为连接状态文件，因为宿主启用开关时会写入该文件。

用户已在本机日常 Magpie 和 Vetta 中手动验证 MCP 分配后可调用、撤回后无法访问。2026-11-25 对新版插件进行隔离发现测试：没有默认 Agent 目录时 Magpie 显示未发现，创建该目录后显示 Vetta；本机日常 Magpie 也识别 Vetta。此实验只证明宿主基于目录的发现行为，尚未验证 macOS、Linux 或自定义目录。

## 发现

当前已核查的独立 Agent 插件接口没有发现能在 Library 分配前校验 Vetta 实例及其运行时目录的钩子。因而不能据此保证“只有可信目标才接受分配”和“未发现可信 Vetta 时不创建错误用户资源”。这是一项待验证的接口限制，不能由静态检查推断所有独立插件方案均不可能。

具体链路：

1. [Agent 插件加载器](https://github.com/yetone/magpie/blob/95e6a4180866afde186e0f1a25369388c7fd7e7f/internal/agentplug/agentplug.go) 在 Magpie 的 moejs 运行时加载模块，将 `agent` 导出反序列化为描述；源码明确说明这里没有 Node。`library.mcp` 是描述中的路径字符串，已列出的 `connect` 和 `own` 钩子分别服务于连接配置与模型列表。
2. [插件 Agent 的创建](https://github.com/yetone/magpie/blob/95e6a4180866afde186e0f1a25369388c7fd7e7f/internal/agent/plugged.go) 将 `config` 展开为 Agent 的 `Path`，可选 `dir` 和 `bin` 用于宿主发现。它们并未提供用于比较 Vetta 实际运行时目录的插件回调。
3. [宿主发现逻辑](https://github.com/yetone/magpie/blob/95e6a4180866afde186e0f1a25369388c7fd7e7f/internal/agent/agent.go) 的 `Detected` 可因配置路径存在、目录或可执行文件存在而返回 true；这些证据本身不能证明 Vetta Desktop 当前使用指定的资源目录。
4. [Library 的 `pluginTarget` 和 `Targets`](https://github.com/yetone/magpie/blob/95e6a4180866afde186e0f1a25369388c7fd7e7f/internal/library/targets.go) 使用描述中展开后的绝对 MCP 路径，按 Agent 发现状态提供目标；在该路径生成流程中没有看到 Vetta 身份或实际运行时路径校验。
5. [Vetta 路径解析和 Desktop MCP runtime](source-findings.md#数据目录) 显示默认位置可被环境变量覆盖。即使 Magpie 和 Vetta 都存在，Magpie 展开的默认路径也不能单独证明是 Vetta 实际读取的位置。

## 如何复核

在上述固定 Magpie 版本中依次检查 `agentplug.Compile`、`plugged`、`Agent.Detected`、`library.pluginTarget` 与 `library.Targets`。构造两个只读推演场景：

- 插件将独立状态文件用于 `config`，将 `~/.vetta/agent/mcp.json` 用于 `library.mcp`。若状态文件存在而 Vetta 不存在，检查发现条件和 Library 目标生成：状态文件存在即可成为发现依据，静态 MCP 路径本身不验证 Vetta。
- Vetta 实际使用不同的 Agent 根，而 Magpie 仍展开默认路径。比较 `pluginTarget` 的结果与 Vetta runtime 的 `agentDir/mcp.json`：接口没有提供证据将两者关联。

第一个场景已通过上述隔离实验部分复现；第二个场景仍是源码推演。这些结果不构成真实 Desktop 验收。

## 后续决策（已由用户调整）

用户决定项目采用默认目录，旧目录和自定义目录由用户自行管理，不再要求插件提供相应发现或兜底。用户确认已手动验证重复启用、重复分配、连接开关以及模型配置和无关资源保持不变，也确认无需为任务 01 增加自动化测试。独立安装包在项目完成后验收。按此范围任务 01 已完成；以上接口分析作为历史记录保留。
