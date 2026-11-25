# magpie-agent-vetta

当前已实现默认目录的实验性 Agent 插件，并通过用户在 Windows Vetta Desktop 的手动调用和撤回验收；项目整体仍在开发中。

插件通过 Magpie 的目录发现机制识别默认目录 `~/.vetta/agent`，并使用其中的 `mcp.json`。用户自行负责旧目录和自定义目录的管理。测试结果见 [任务 01 宿主接口核查](docs/task-01-host-constraint.md)。

## 已确认的首版目标

独立安装一个 Magpie Agent 插件，让 Magpie 识别 Windows 上的 Vetta Desktop，并让 Vetta 使用 Magpie Library 分配的 MCP 与 Skills。沿用 Magpie 原生资源接管和冲突机制，模型接入继续使用 Vetta 自带的 Magpie 预设。

最终公开交付要求能在 Magpie 插件发现/搜索界面找到并下载安装；仅本地目录安装不算最终完成。当前尚未实现或发布，不能在市场中搜索到本项目。

插件使用默认目录，不提供自定义目录或旧目录的发现及选择兜底。资源变化以新会话读到最新状态为保底，当前轮次可以保留快照。

首版不要求修改或重新编译 Magpie、Vetta。启动管理排除；会话统计与调用记录留到后续阶段。CLI、macOS、Linux 验证后再承诺支持。

## 文档入口

- [任务拆分草案](docs/ticket-plan.md)：九个可验证的纵向切片及其阻塞关系，含市场发布验收；待确认后发布逐票任务。
- [规格草案](docs/spec.md)：按 to-spec 模板综合需求、用户故事、实现约束和测试决策；测试边界待确认，尚未发布 Issue。
- [需求基线](docs/requirements.md)：已确认范围、验收场景与宿主行为。
- [决策树](docs/design-tree.md)：D1–D6 的逐项决定、工程验证事项。
- [源码核查](docs/source-findings.md)：固定版本证据、接口约束和兼容性限制。
- [术语表](GLOSSARY.md)：本项目使用的领域术语。

## 当前状态

任务 01、02 已按当前范围完成。用户手动验证了真实 Vetta 的 MCP 调用与撤回，以及 Skill 发现、正文和附属资源读取、获准脚本执行与撤回；重复操作、连接开关、模型配置和无关资源也已按任务 01 范围验证。router 和独立安装包仍需后续验收。

## 本地开发

开发工具支持 Node.js 22（至少 22.23.0）或 Node.js 24；仓库 `.node-version` 固定当前使用的 22.23.4。使用 pnpm 10，具体版本由 `packageManager` 固定。开发环境版本不代表 Magpie/Vetta 的最低兼容版本。

```sh
npm install --global pnpm@10.34.5
pnpm install --frozen-lockfile
pnpm check:ci
```

| 命令                | 用途                                        |
| ------------------- | ------------------------------------------- |
| `pnpm dev`          | 使用 tsdown 监听源码并打包到 `dist/`        |
| `pnpm build`        | 使用 tsdown 打包 ESM、声明文件与 source map |
| `pnpm typecheck`    | 执行严格 TypeScript 类型检查，不生成文件    |
| `pnpm lint`         | 使用 Biome 检查代码规则                     |
| `pnpm format:check` | 检查代码、配置、Markdown 和 YAML 的格式     |
| `pnpm format`       | 自动格式化上述文件                          |
| `pnpm check`        | 依次执行类型、lint 与格式检查               |
| `pnpm check:ci`     | 执行静态检查、测试覆盖率与打包              |

Biome 负责 TypeScript/JavaScript/JSON；Prettier 负责 Markdown/YAML，两个格式器按文件类型分工。依赖使用精确版本，提交 `pnpm-lock.yaml`，CI 通过冻结锁文件安装。GitHub Actions 在 Windows/Linux、Node.js 22/24 上执行 `pnpm check:ci`；这只验证工程工具链，不代表应用集成已通过验收。

## 打包与测试

打包使用 tsdown，构建时清理旧产物，输出 ESM、类型声明及 source map。当前采用中立平台的 ES2022 工程产物；Magpie 宿主最终要求的入口格式仍需契约验证。

| 命令                 | 用途                                                          |
| -------------------- | ------------------------------------------------------------- |
| `pnpm test`          | 使用 Vitest 执行一次测试                                      |
| `pnpm test:watch`    | 监听并重跑测试                                                |
| `pnpm test:coverage` | 执行测试并通过 V8 生成 text、HTML 和 LCOV 覆盖率              |
| `pnpm pack:check`    | 构建并生成 `artifacts/magpie-agent-vetta.tgz`，用于检查包内容 |

测试环境为 Node.js，支持 `src/**/*.test.ts` 和 `tests/**/*.test.ts`，可控测试资源放在 `tests/fixtures/`。工具配置及测试文件也纳入类型检查。当前没有业务测试，因此临时开启 `passWithNoTests`；空测试集会明确报告，不能代表业务验收通过。首个功能测试落地时应移除此选项，覆盖率阈值随有效测试建立。

包内容限定为 `dist/`、README、LICENSE 和包管理器自动包含的 `package.json`。本地打包不发布到 npm；包仍为 private，尚无 Magpie 插件声明。

## 目录结构

```text
.github/workflows/ci.yml  自动化检查
src/
  index.ts               工程编译入口，尚未注册宿主插件
  agent/                 后续的 Magpie Agent 注册与连接状态适配
  discovery/             后续的 Vetta 目录发现与目标校验
  library/               后续的 MCP/Skills 资源入口适配
  # 上述三个职责目录由 .gitkeep 保留，随实际实现移除
tests/fixtures/          后续契约测试使用的隔离资源
tsdown.config.ts         打包配置
vitest.config.ts         测试与覆盖率配置
docs/                    需求、规格、源码证据和任务规划
```

当前构建产物已通过本地目录安装和用户手动验收；独立安装包尚待项目完成后的验收。`package.json` 暂设 `private: true`，尚未公开发布。

## 许可证

本项目采用 [MIT License](LICENSE)。
