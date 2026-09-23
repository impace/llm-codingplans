// ==UserScript==
// @name         大模型代码订阅对比与更新雷达 (LLM CodePlans Pro)
// @namespace    https://github.com/impace/llm-codingplans
// @version      2.14.8
// @description  大模型代码订阅对比、动态更新追踪、AI辅助结构化抽取与购物车式用量测算工具
// @author       impace
// @match        *://*/*
// @updateURL    https://raw.githubusercontent.com/impace/llm-codingplans/main/LLMCodePlansPro.user.js
// @downloadURL  https://raw.githubusercontent.com/impace/llm-codingplans/main/LLMCodePlansPro.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM_setClipboard
// @connect      *
// @noframes
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // ======================== 1. 厂商数据库 ========================
    const PROVIDERS_DATA = [
        {
            id: 'deepseek',
            name: 'DeepSeek',
            category: '独立厂商',
            tag: '性价比度量衡',
            plans: '按量 API：V4.1 Flash 输入 ¥0.04~2/M、输出 ¥4~8/M；V4 Pro 输入 ¥0.3~9/M、输出 ¥13.5~27/M',
            quotaDesc: '随用随扣，无月费、无额度过期、无5小时限制，计费透明',
            models: 'DeepSeek-V4.1-Flash、DeepSeek-V4-Pro',
            promos: '空闲时段价格为高峰时段一半；缓存命中输入显著低于未命中输入',
            traps: '高峰期 API 可能遭遇突发并发限流，开发场景建议备用模型兜底',
            verifiedAt: '2026-09-19（官方价格页）',
            links: {
                pricing: [{ title: '模型价格表', url: 'https://api-docs.deepseek.com/zh-cn/quick_start/pricing' }],
                updates: [{ title: 'API 与版本更新日志', url: 'https://api-docs.deepseek.com/zh-cn/updates' }]
            }
        },
        {
            id: 'bailian',
            name: '阿里百炼',
            category: '国内大厂',
            tag: '首选主力',
            plans: 'Lite ¥39/月 | Essential ¥79/月 | Standard ¥139/月 | Pro ¥499/月',
            quotaDesc: 'Credits 统一计量；每 7 天限额分别约 2,500 / 5,625 / 10,000 / 40,000',
            models: 'Qwen、DeepSeek 等文本/多模态模型，以官方模型列表为准',
            promos: '当前页面价格包含限时优惠，Standard/Pro 附带 Harness 权益',
            traps: '仅限 IDE/Agent 插件调用，禁止脚本批量请求；5小时额度在重度重构时易触顶',
            verifiedAt: '2026-09-19（官方个人版概览）',
            links: {
                pricing: [
                    { title: '个人版套餐概览', url: 'https://docs.bailian.console.aliyun.com/zh/model-studio/token-plan-personal-overview' },
                    { title: '团队版套餐概览', url: 'https://docs.bailian.console.aliyun.com/zh/model-studio/token-plan-team-overview' }
                ],
                updates: [
                    { title: '新上线模型公告', url: 'https://docs.bailian.console.aliyun.com/zh/model-studio/newly-released-models' },
                    { title: '模型发版记录', url: 'https://docs.bailian.console.aliyun.com/zh/model-studio/model-release-notes' }
                ]
            }
        },
        {
            id: 'volcengine',
            name: '火山方舟',
            category: '国内大厂',
            tag: '尝鲜首月',
            plans: 'Lite ¥40/月 (首月¥9.9) | Pro ¥200/月 (首月¥49.9)',
            quotaDesc: '调用次数制：Lite 1.8万次/月 (1200次/5h)；Pro 9万次/月',
            models: '豆包全系、DeepSeek 系列、GLM 系列、Kimi',
            promos: '新客首月秒杀 ¥9.9，支持连续包季优惠',
            traps: '调用次数名义极高，但在多文件长上下文场景存在截断，适合排障中轻度补全',
            verifiedAt: '2026-09-19（官方页面渲染正文）',
            links: {
                pricing: [{ title: 'Coding Plan 概览', url: 'https://docs.volcengine.com/docs/ark/coding-plan-personal-plan-overview?lang=zh' }],
                updates: [
                    { title: '功能发布更新指南', url: 'https://docs.volcengine.com/docs/ark/coding-plan-personal-feature-release?lang=zh' },
                    { title: '个人版活动公告', url: 'https://docs.volcengine.com/docs/ark/coding-plan-personal-announcements?lang=zh' }
                ]
            }
        },
        {
            id: 'qianfan',
            name: '百度千帆',
            category: '国内大厂',
            tag: '突击不限频',
            plans: 'Coding Plan Lite ¥40/月 | Pro ¥200/月',
            quotaDesc: '请求次数制：Lite 1,200次/5h、9,000次/周、18,000次/月；Pro 6,000次/5h、45,000次/周、90,000次/月',
            models: 'ERNIE、DeepSeek V4、GLM、Kimi、MiniMax 等，以当前模型表为准',
            promos: '活动价格和可用模型可能变化，购买前应重新检查官方页面',
            traps: '同时受 5 小时、每周、每月窗口限制；仅供编程工具交互，禁止自动化脚本和后端批量调用',
            verifiedAt: '2026-09-19（官方 Coding Plan 文档）',
            links: {
                pricing: [
                    { title: '套餐概览一', url: 'https://cloud.baidu.com/doc/qianfan/s/imlg0beiu' },
                    { title: '套餐概览二', url: 'https://cloud.baidu.com/doc/qianfan/s/Dmrabu8b6' },
                    { title: '套餐概览三', url: 'https://cloud.baidu.com/doc/qianfan/s/ymq8wwch2' }
                ],
                updates: [
                    { title: '功能更新公告 1', url: 'https://cloud.baidu.com/doc/qianfan/s/Mmh8l4qwj' },
                    { title: '发版公告 2', url: 'https://cloud.baidu.com/doc/qianfan/s/Kmh4stnjp' },
                    { title: '升级公告 3', url: 'https://cloud.baidu.com/doc/qianfan/s/Gmh4stncc' }
                ]
            }
        },
        {
            id: 'copilot',
            name: 'GitHub Copilot',
            category: '海外服务',
            tag: '生态基石',
            plans: 'Free $0 | Pro $10/月 (约¥72) | Pro+ $39/月 | Max $100/月',
            quotaDesc: '补全绝对无限量；高级 Chat / Agent 按月度 AI Credits 管理',
            models: '动态调整；Pro 支持自主选模，Pro+/Max 提供高级模型和额度',
            promos: '学生认证及开源项目维护者可申请免费',
            traps: 'Agent 模式受每月额度限制，超额后无法无限制执行复杂工程修改',
            verifiedAt: '2026-09-19（GitHub 官方 Plans）',
            links: {
                pricing: [{ title: 'Copilot 方案详情', url: 'https://github.com/features/copilot/plans' }],
                updates: [{ title: 'GitHub 官方更新日志', url: 'https://github.blog/changelog/?label=copilot' }]
            }
        },
        {
            id: 'zhipu',
            name: '智谱 AI',
            category: '独立厂商',
            tag: '代码特化',
            plans: 'Lite ¥118/月 | Pro ¥538/月 | Max ¥1078/月',
            quotaDesc: '双窗口积分制：Lite 2,000/5h、10,000/周；Pro 12,000/5h、60,000/周；Max 28,000/5h、140,000/周',
            models: 'GLM-5.3、GLM-5.3-Flash',
            promos: '非高峰时段按 50% 积分抵扣；支持连续包年折扣',
            traps: '受每周积分硬顶约束，单周内连续高频编码可能提前触顶',
            verifiedAt: '2026-09-19（官方 Coding Plan 文档）',
            links: {
                pricing: [{ title: 'Coding Plan 概览', url: 'https://docs.bigmodel.cn/cn/coding-plan/overview' }],
                updates: [
                    { title: '新模型发布动态', url: 'https://docs.bigmodel.cn/cn/update/new-releases' },
                    { title: '平台功能演进', url: 'https://docs.bigmodel.cn/cn/update/feature-updates' }
                ]
            }
        },
        {
            id: 'tencent',
            name: '腾讯云',
            category: '国内大厂',
            tag: '混合抵扣',
            plans: 'Standard ¥99、Pro ¥299、Max ¥599 等积分档',
            quotaDesc: '采用积分制，按官方模型系数抵扣消耗',
            models: '腾讯混元、DeepSeek 系列等',
            promos: '新用户赠送基础抵扣量',
            traps: '若主要调用第三方模型，折算倍率消耗相对较快',
            verifiedAt: '2026-09-19（官方文档）',
            links: {
                pricing: [
                    { title: 'Token Plan 说明 1', url: 'https://cloud.tencent.com/document/product/1823/130060' },
                    { title: 'Token Plan 说明 2', url: 'https://cloud.tencent.com/document/product/1823/131172' }
                ],
                rules: [
                    { title: '积分用量抵扣规则', url: 'https://cloud.tencent.com/document/product/1823/133811' }
                ],
                updates: [
                    { title: '更新公告 1', url: 'https://cloud.tencent.com/document/product/1823/130675' },
                    { title: '更新公告 2', url: 'https://cloud.tencent.com/document/product/1823/130758' }
                ]
            }
        },
        {
            id: 'mimo',
            name: '小米 MiMo',
            category: '国内大厂',
            tag: '大算力包',
            plans: 'Lite ¥39/月 | Standard ¥99/月 | Pro ¥329/月 | Max ¥659/月',
            quotaDesc: '固定 Credits：4.1B / 11B / 38B / 82B 每月',
            models: 'MiMo v2.5 系列模型',
            promos: '年付约 88 折；夜间享 0.8 倍 Credits 扣费优惠',
            traps: '积分量给得足，但特大项目工程重构能力与顶级旗舰仍有差距',
            verifiedAt: '2026-09-19（官方 Token Plan）',
            links: {
                pricing: [{ title: 'Token Plan 定价', url: 'https://mimo.mi.com/docs/zh-CN/price/token-plan' }],
                updates: [{ title: '模型发版记录', url: 'https://mimo.mi.com/docs/zh-CN/updates/model' }]
            }
        },
        {
            id: 'kimi',
            name: 'Kimi (月之暗面)',
            category: '独立厂商',
            tag: '超长上下文',
            plans: 'Plus 年付折算 ¥79/月 | Pro ¥159/月 | Max ¥559/月',
            quotaDesc: '新会员体系按套餐等级管理，取消独立周限额；未公开稳定 Token 月容量',
            models: 'Kimi Code、K 系列模型',
            promos: '年付立省；购买 Code Plan 附带 Kimi 网页端完整权益',
            traps: '官方只描述额度等级，无法稳定换算 Token 总量，需结合实测',
            verifiedAt: '2026-09-19（Kimi Code 官方页）',
            links: {
                pricing: [{ title: 'Kimi Code 定价', url: 'https://www.kimi.com/code/#pricing' }],
                updates: [{ title: "What's New 更新日志", url: 'https://www.kimi.com/code/docs/kimi-code/whats-new.html' }]
            }
        },
        {
            id: 'openai',
            name: 'OpenAI (ChatGPT)',
            category: '海外服务',
            tag: '高阶推理',
            plans: 'Codex：Free $0 | Go $8/月 | Plus $20/月 | Pro 从 $100/月起',
            quotaDesc: '本地消息和云任务共享计划用量；Pro 提供 Plus 的 5x 或 20x 档位',
            models: 'GPT-5 系列、o 系列高推理模型',
            promos: '支持 CLI、IDE 扩展和 Web 多端同步',
            traps: '限额受模型、深度思考和工具链影响，并非无限使用',
            verifiedAt: '2026-09-19（OpenAI Docs）',
            links: {
                pricing: [{ title: 'ChatGPT 定价说明', url: 'https://learn.chatgpt.com/docs/pricing' }],
                updates: [{ title: '官方 Changelog', url: 'https://learn.chatgpt.com/docs/changelog' }]
            }
        },
        {
            id: 'grok',
            name: 'xAI Grok',
            category: '海外服务',
            tag: '超大窗口',
            plans: 'SuperGrok Lite | SuperGrok | SuperGrok Plus | SuperGrok Heavy',
            quotaDesc: '官方以相对倍数展示：Lite 2x、SuperGrok 5x；未公开固定 Token 数',
            models: 'Grok 旗舰系列及专家模式',
            promos: '年付优惠；高级档位关联 X Premium+ 社交权益',
            traps: '无直接透明的 Token 容量，IDE 原生集成度低于竞品',
            verifiedAt: '2026-09-19（Grok 官方 Plans）',
            links: {
                pricing: [{ title: 'Grok 订阅说明', url: 'https://grok.com/plans' }],
                updates: [{ title: '开发者 Release Notes', url: 'https://docs.x.ai/developers/release-notes' }]
            }
        }
    ];

    // ======================== 2. 基础配置与探针工具 ========================
    const APP_VERSION = '2.14.8';
    const PROVIDER_SETTINGS_KEY = 'llm_provider_settings_v2';
    const APP_SETTINGS_KEY = 'llm_app_settings_v1';
    const SOURCE_PROBE_KEY_PREFIX = 'llm_source_probe_v2_';
    const RENDER_REQUEST_KEY_PREFIX = 'llm_render_request_v1_';
    const AI_SNAPSHOT_KEY_PREFIX = 'llm_ai_snapshot_v1_';
    const CALC_CART_KEY = 'llm_calc_cart_v1';
    const SETTINGS_SCHEMA_VERSION = 4;
    const MAX_PROBE_BYTES = 500000;
    const MAX_AI_EXCERPT_CHARS = 18000;
    const MAX_AI_EVIDENCE_CHARS = 18000;
    const MAX_AI_FIELD_EVIDENCE_CHARS = 220;
    const MAX_AI_SOURCE_CHARS = 180000;
    const REQUEST_TOKEN_SCENARIOS = {
        conservative: 8000,
        baseline: 32000,
        optimistic: 100000
    };

    const DEFAULT_APP_SETTINGS = {
        ai: {
            enabled: false,
            endpoint: 'https://api.openai.com/v1/chat/completions',
            model: 'gpt-4o-mini',
            apiKey: '',
            runOnFirstCheck: false,
            maxExcerptChars: 14000,
            maxEvidenceChars: 9000,
            timeoutSeconds: 120,
            testTimeoutSeconds: 120
        },
        currency: {
            display: 'CNY',
            rates: 'USD=7.20\nEUR=8.00\nGBP=9.30\nJPY=0.050\nHKD=0.92\nKRW=0.0052\nSGD=5.35\nCAD=5.20\nAUD=4.70'
        }
    };

    // 这里只放“可公开核对或明确标注未知”的基准，不把调用次数/积分
    // 擅自换算成 Token。未知容量保持未知，不要求用户在购物车中手动补填。
    const CART_ACCOUNT_ROWS = [
        { id: 'bailian-lite', providerId: 'bailian', plan: 'Lite', price: 39, currency: 'CNY', capacityB: null, capacityMode: 'unknown', bottleneck: '约 2,500 Credits / 7 天；Credits 与 Token 的换算需实测', evidence: '官方给出 Credits，未给出稳定 Token 等价物' },
        { id: 'bailian-essential', providerId: 'bailian', plan: 'Essential', price: 79, currency: 'CNY', capacityB: null, capacityMode: 'unknown', bottleneck: '约 5,625 Credits / 7 天；Credits 与 Token 的换算需实测', evidence: '官方给出 Credits，未给出稳定 Token 等价物' },
        { id: 'bailian-standard', providerId: 'bailian', plan: 'Standard', price: 139, currency: 'CNY', capacityB: null, capacityMode: 'unknown', bottleneck: '约 10,000 Credits / 7 天；Credits 与 Token 的换算需实测', evidence: '官方给出 Credits，未给出稳定 Token 等价物' },
        { id: 'bailian-pro', providerId: 'bailian', plan: 'Pro', price: 499, currency: 'CNY', capacityB: null, capacityMode: 'unknown', bottleneck: '约 40,000 Credits / 7 天；Credits 与 Token 的换算需实测', evidence: '官方给出 Credits，未给出稳定 Token 等价物' },
        { id: 'volcengine-lite', providerId: 'volcengine', plan: 'Lite', price: 40, currency: 'CNY', capacityB: null, capacityMode: 'unknown', bottleneck: '18,000 次/月、1,200 次/5 小时；Token 上限需实测', evidence: '官方给出请求次数，没有固定 Token 月容量' },
        { id: 'volcengine-pro', providerId: 'volcengine', plan: 'Pro', price: 200, currency: 'CNY', capacityB: null, capacityMode: 'unknown', bottleneck: '90,000 次/月；Token 上限需实测', evidence: '官方给出请求次数，没有固定 Token 月容量' },
        { id: 'qianfan-lite', providerId: 'qianfan', plan: 'Lite', price: 40, currency: 'CNY', capacityB: null, capacityMode: 'unknown', bottleneck: '18,000 次/月、1,200 次/5 小时；Token 上限需实测', evidence: '官方给出请求次数，没有固定 Token 月容量' },
        { id: 'qianfan-pro', providerId: 'qianfan', plan: 'Pro', price: 200, currency: 'CNY', capacityB: null, capacityMode: 'unknown', bottleneck: '90,000 次/月、6,000 次/5 小时；Token 上限需实测', evidence: '官方给出请求次数，没有固定 Token 月容量' },
        { id: 'zhipu-lite', providerId: 'zhipu', plan: 'Lite', price: 118, currency: 'CNY', capacityB: null, capacityMode: 'unknown', bottleneck: '10,000 积分/周；积分与 Token 的换算需实测', evidence: '官方给出积分窗口，没有稳定 Token 月容量' },
        { id: 'zhipu-pro', providerId: 'zhipu', plan: 'Pro', price: 538, currency: 'CNY', capacityB: null, capacityMode: 'unknown', bottleneck: '60,000 积分/周；积分与 Token 的换算需实测', evidence: '官方给出积分窗口，没有稳定 Token 月容量' },
        { id: 'zhipu-max', providerId: 'zhipu', plan: 'Max', price: 1078, currency: 'CNY', capacityB: null, capacityMode: 'unknown', bottleneck: '140,000 积分/周；积分与 Token 的换算需实测', evidence: '官方给出积分窗口，没有稳定 Token 月容量' },
        { id: 'tencent-standard', providerId: 'tencent', plan: 'Standard', price: 99, currency: 'CNY', capacityB: null, capacityMode: 'unknown', bottleneck: '积分按模型系数抵扣；Token 上限需实测', evidence: '官方给出积分制，没有统一 Token 月容量' },
        { id: 'tencent-pro', providerId: 'tencent', plan: 'Pro', price: 299, currency: 'CNY', capacityB: null, capacityMode: 'unknown', bottleneck: '积分按模型系数抵扣；Token 上限需实测', evidence: '官方给出积分制，没有统一 Token 月容量' },
        { id: 'tencent-max', providerId: 'tencent', plan: 'Max', price: 599, currency: 'CNY', capacityB: null, capacityMode: 'unknown', bottleneck: '积分按模型系数抵扣；Token 上限需实测', evidence: '官方给出积分制，没有统一 Token 月容量' },
        { id: 'mimo-lite', providerId: 'mimo', plan: 'Lite', price: 39, currency: 'CNY', capacityB: 4.1, capacityMode: 'official-credit', bottleneck: '月度固定 4.1B Credits', evidence: '官方 Token Plan 标示 4.1B；需确认 Credits 与你的 Token 口径是否一致' },
        { id: 'mimo-standard', providerId: 'mimo', plan: 'Standard', price: 99, currency: 'CNY', capacityB: 11, capacityMode: 'official-credit', bottleneck: '月度固定 11B Credits', evidence: '官方 Token Plan 标示 11B；需确认 Credits 与你的 Token 口径是否一致' },
        { id: 'mimo-pro', providerId: 'mimo', plan: 'Pro', price: 329, currency: 'CNY', capacityB: 38, capacityMode: 'official-credit', bottleneck: '月度固定 38B Credits', evidence: '官方 Token Plan 标示 38B；需确认 Credits 与你的 Token 口径是否一致' },
        { id: 'mimo-max', providerId: 'mimo', plan: 'Max', price: 659, currency: 'CNY', capacityB: 82, capacityMode: 'official-credit', bottleneck: '月度固定 82B Credits', evidence: '官方 Token Plan 标示 82B；需确认 Credits 与你的 Token 口径是否一致' },
        { id: 'kimi-plus', providerId: 'kimi', plan: 'Plus', price: 79, currency: 'CNY', capacityB: null, capacityMode: 'unknown', bottleneck: '会员等级额度；官方未公开稳定 Token 月容量', evidence: '官方按等级描述，需用户实测' },
        { id: 'kimi-pro', providerId: 'kimi', plan: 'Pro', price: 159, currency: 'CNY', capacityB: null, capacityMode: 'unknown', bottleneck: '会员等级额度；官方未公开稳定 Token 月容量', evidence: '官方按等级描述，需用户实测' },
        { id: 'kimi-max', providerId: 'kimi', plan: 'Max', price: 559, currency: 'CNY', capacityB: null, capacityMode: 'unknown', bottleneck: '会员等级额度；官方未公开稳定 Token 月容量', evidence: '官方按等级描述，需用户实测' },
        { id: 'copilot-free', providerId: 'copilot', plan: 'Free', price: 0, currency: 'USD', capacityB: null, capacityMode: 'unknown', bottleneck: '补全与高级请求分开；Token 上限不公开', evidence: '官方以高级请求/额度说明，不能直接换算 Token' },
        { id: 'copilot-pro', providerId: 'copilot', plan: 'Pro', price: 10, currency: 'USD', capacityB: null, capacityMode: 'unknown', bottleneck: '高级 Chat / Agent 按月度 AI Credits 管理', evidence: '官方以 Credits 说明，需用户实测' },
        { id: 'copilot-pro-plus', providerId: 'copilot', plan: 'Pro+', price: 39, currency: 'USD', capacityB: null, capacityMode: 'unknown', bottleneck: '高级 Chat / Agent 按月度 AI Credits 管理', evidence: '官方以 Credits 说明，需用户实测' },
        { id: 'copilot-max', providerId: 'copilot', plan: 'Max', price: 100, currency: 'USD', capacityB: null, capacityMode: 'unknown', bottleneck: '高级 Chat / Agent 按月度 AI Credits 管理', evidence: '官方以 Credits 说明，需用户实测' },
        { id: 'openai-go', providerId: 'openai', plan: 'Go', price: 8, currency: 'USD', capacityB: null, capacityMode: 'unknown', bottleneck: '计划按消息、模型和深度思考计量；Token 上限不公开', evidence: '官方计划倍数/消息额度不能直接换算 Token' },
        { id: 'openai-plus', providerId: 'openai', plan: 'Plus', price: 20, currency: 'USD', capacityB: null, capacityMode: 'unknown', bottleneck: '计划按消息、模型和深度思考计量；Token 上限不公开', evidence: '官方计划倍数/消息额度不能直接换算 Token' },
        { id: 'openai-pro', providerId: 'openai', plan: 'Pro', price: 100, currency: 'USD', capacityB: null, capacityMode: 'unknown', bottleneck: '按模型、深度思考和工具链消耗；Token 上限不公开', evidence: '官方计划倍数/消息额度不能直接换算 Token' },
        { id: 'grok-lite', providerId: 'grok', plan: 'SuperGrok Lite', price: null, currency: 'USD', capacityB: null, capacityMode: 'unknown', bottleneck: '官方以相对倍数展示；固定 Token 月容量未公开', evidence: '价格/额度需按当前地区页面填写' },
        { id: 'grok-standard', providerId: 'grok', plan: 'SuperGrok', price: null, currency: 'USD', capacityB: null, capacityMode: 'unknown', bottleneck: '官方以相对倍数展示；固定 Token 月容量未公开', evidence: '价格/额度需按当前地区页面填写' },
        { id: 'grok-plus', providerId: 'grok', plan: 'SuperGrok Plus', price: null, currency: 'USD', capacityB: null, capacityMode: 'unknown', bottleneck: '官方以相对倍数展示；固定 Token 月容量未公开', evidence: '价格/额度需按当前地区页面填写' },
        { id: 'grok-heavy', providerId: 'grok', plan: 'SuperGrok Heavy', price: null, currency: 'USD', capacityB: null, capacityMode: 'unknown', bottleneck: '官方以相对倍数展示；固定 Token 月容量未公开', evidence: '价格/额度需按当前地区页面填写' }
    ];

    const API_COST_PROFILES = [
        {
            id: 'deepseek-flash-mixed',
            name: 'DeepSeek V4.1 Flash 混合基准',
            inputCache: 0.04,
            inputMiss: 2,
            output: 4,
            outputShare: 0.10,
            cacheHitShare: 0.80,
            note: '按每百万 Token；用于估算缺口，不代表订阅可调用模型的实际单价'
        },
        {
            id: 'custom',
            name: '自定义 API 兜底单价',
            inputCache: 0,
            inputMiss: 0,
            output: 0,
            outputShare: 0,
            cacheHitShare: 0,
            note: '直接填写人民币 / B Token'
        }
    ];

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function isHttpUrl(value) {
        try {
            const url = new URL(String(value));
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    }

    function hashText(value) {
        let hash = 2166136261;
        for (let i = 0; i < value.length; i += 1) {
            hash ^= value.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(16).padStart(8, '0');
    }

    function sourceKey(url) { return `${SOURCE_PROBE_KEY_PREFIX}${hashText(url)}`; }

    function formatDate(value) {
        if (!value) return '未检查';
        try {
            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
        } catch {
            return String(value);
        }
    }

    function readProviderSettings() {
        const saved = GM_getValue(PROVIDER_SETTINGS_KEY, {});
        const settings = saved && typeof saved === 'object' ? saved : {};
        if (Number(settings.__schemaVersion || 0) >= SETTINGS_SCHEMA_VERSION) return settings;
        settings.__schemaVersion = SETTINGS_SCHEMA_VERSION;
        GM_setValue(PROVIDER_SETTINGS_KEY, settings);
        return settings;
    }

    function normalizeProvider(provider) {
        const s = provider && typeof provider === 'object' ? provider : {};
        return {
            id: String(s.id || '').trim(),
            name: String(s.name || s.id || '未命名厂商').trim(),
            category: String(s.category || '自定义').trim(),
            tag: String(s.tag || '自定义').trim(),
            plans: String(s.plans || '请补充套餐信息').trim(),
            quotaDesc: String(s.quotaDesc || '请补充额度规则').trim(),
            models: String(s.models || '请补充模型信息').trim(),
            promos: String(s.promos || '请补充优惠信息').trim(),
            traps: String(s.traps || '请自行核验限制条件').trim(),
            verifiedAt: String(s.verifiedAt || '未核验').trim(),
            links: {
                pricing: Array.isArray(s.links?.pricing) ? s.links.pricing : [],
                rules: Array.isArray(s.links?.rules) ? s.links.rules : [],
                updates: Array.isArray(s.links?.updates) ? s.links.updates : []
            }
        };
    }

    function mergeProviderLinks(provider, savedProvider) {
        provider = normalizeProvider(provider);
        const savedLinks = savedProvider?.links || {};
        const links = {
            pricing: provider.links.pricing.map(l => ({ ...l })),
            rules: provider.links.rules.map(l => ({ ...l })),
            updates: provider.links.updates.map(l => ({ ...l }))
        };
        ['pricing', 'rules', 'updates'].forEach(type => {
            if (!Array.isArray(savedLinks[type])) return;
            const custom = savedLinks[type]
                .filter(l => l && isHttpUrl(l.url))
                .map(l => ({ title: String(l.title || '自定义来源').trim(), url: l.url.trim() }));
            // 空数组也是用户明确保存的结果，允许用它清空内置来源。
            links[type] = custom;
        });
        return links;
    }

    function getAllProviders() {
        const settings = readProviderSettings();
        const builtinIds = new Set(PROVIDERS_DATA.map(p => p.id));
        const customProviders = Array.isArray(settings.__customProviders)
            ? settings.__customProviders.map(normalizeProvider).filter(p => p.id && !builtinIds.has(p.id))
            : [];
        return [...PROVIDERS_DATA.map(normalizeProvider), ...customProviders].map(p => {
            const saved = settings[p.id] || {};
            return {
                ...p,
                custom: !builtinIds.has(p.id),
                enabled: saved.enabled !== false,
                links: mergeProviderLinks(p, saved)
            };
        });
    }

    function getEnabledProviders() {
        return getAllProviders().filter(p => p.enabled);
    }

    function getUsableLinks(provider, type) {
        return Array.isArray(provider.links?.[type])
            ? provider.links[type].filter(l => l && isHttpUrl(l.url))
            : [];
    }

    function safeHref(url) {
        return isHttpUrl(url) ? escapeHtml(url) : '#';
    }

    function parseLinkLines(value) {
        return String(value || '').split(/\r?\n/)
            .map(l => l.trim()).filter(Boolean)
            .map(line => {
                const idx = line.indexOf('|');
                const title = idx >= 0 ? line.slice(0, idx).trim() : '自定义来源';
                const url = idx >= 0 ? line.slice(idx + 1).trim() : line;
                return { title: title || '自定义来源', url };
            })
            .filter(l => isHttpUrl(l.url));
    }

    function saveProviderSettings(settings) {
        settings.__schemaVersion = SETTINGS_SCHEMA_VERSION;
        GM_setValue(PROVIDER_SETTINGS_KEY, settings);
    }

    const PROVIDER_COLORS = {
        deepseek: '#4f8cff', bailian: '#ff8a3d', volcengine: '#6c63ff', qianfan: '#4aa3df',
        copilot: '#a371f7', zhipu: '#27ae60', tencent: '#18a6d9', mimo: '#ff6b81',
        kimi: '#f0a13a', openai: '#10a37f', grok: '#9aa4b2'
    };

    function providerColor(providerId) {
        return PROVIDER_COLORS[String(providerId || '').trim()] || '#58a6ff';
    }

    function planTone(plan) {
        const value = String(plan || '').toLowerCase();
        if (/max|ultra|heavy/.test(value)) return 0.92;
        if (/pro\+|pro/.test(value)) return 0.72;
        if (/standard|plus/.test(value)) return 0.54;
        if (/lite|free|go/.test(value)) return 0.38;
        return 0.62;
    }

    function mergeSettings(base, override) {
        const source = override && typeof override === 'object' ? override : {};
        return {
            ...base,
            ...source,
            ai: { ...base.ai, ...(source.ai || {}) },
            currency: { ...base.currency, ...(source.currency || {}) }
        };
    }

    function readAppSettings() {
        return mergeSettings(DEFAULT_APP_SETTINGS, GM_getValue(APP_SETTINGS_KEY, {}));
    }

    function saveAppSettings(settings) {
        GM_setValue(APP_SETTINGS_KEY, mergeSettings(DEFAULT_APP_SETTINGS, settings));
    }

    function aiSnapshotKey(url) {
        return AI_SNAPSHOT_KEY_PREFIX + hashText(url);
    }

    function getAiEndpointInfo(endpoint) {
        try {
            const parsed = new URL(String(endpoint || ''));
            return { host: parsed.host, path: parsed.pathname || '/', protocol: parsed.protocol };
        } catch {
            return { host: '', path: '', protocol: '' };
        }
    }

    function sanitizeAiDiagnosticText(value, maxLength = 320) {
        return String(value || '')
            .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, 'Bearer [已隐藏]')
            .replace(/(["']?)(?:api[_ -]?key|apikey|access[_ -]?token|secret)(\1)\s*[:=]\s*(["']?)[A-Za-z0-9._~-]+\3/gi, '[凭证]=[已隐藏]')
            .replace(/sk-[A-Za-z0-9_-]+/g, 'sk-[已隐藏]')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, maxLength);
    }

    function summarizeAiResponse(responseText) {
        const raw = String(responseText || '').trim();
        if (!raw) return '响应体为空';
        try {
            const payload = JSON.parse(raw);
            const error = payload?.error;
            const message = typeof error === 'string' ? error : (error?.message || error?.detail || error?.code || payload?.message || '');
            if (message) return sanitizeAiDiagnosticText(message);
            return 'JSON 响应，但未找到可读错误字段';
        } catch {
            return sanitizeAiDiagnosticText(raw);
        }
    }

    function buildAiDiagnostics(endpoint, model, phase, extra = {}) {
        const info = getAiEndpointInfo(endpoint);
        return {
            endpointHost: info.host,
            endpointPath: info.path,
            model: String(model || ''),
            phase: String(phase || ''),
            checkedAt: new Date().toISOString(),
            ...extra
        };
    }

    function flattenAiText(value) {
        if (typeof value === 'string') return value;
        if (Array.isArray(value)) return value.map(flattenAiText).filter(Boolean).join('');
        if (!value || typeof value !== 'object') return '';
        if (typeof value.text === 'string') return value.text;
        if (typeof value.output_text === 'string') return value.output_text;
        if (typeof value.value === 'string') return value.value;
        if (value.content !== undefined) return flattenAiText(value.content);
        return '';
    }

    function extractAiResponse(payload) {
        const source = payload && typeof payload === 'object' ? payload : {};
        const choice = Array.isArray(source.choices) ? (source.choices[0] || {}) : {};
        const message = choice.message && typeof choice.message === 'object' ? choice.message : {};
        const outputItems = Array.isArray(source.output) ? source.output : [];
        const outputContent = outputItems.flatMap(item => Array.isArray(item?.content) ? item.content : []);
        const outputText = outputContent
            .filter(part => !part?.type || /(?:output_)?text|message/i.test(String(part.type)))
            .map(flattenAiText)
            .filter(Boolean)
            .join('');
        const outputReasoning = outputItems
            .filter(item => /reason/i.test(String(item?.type || '')))
            .map(item => flattenAiText(item?.summary || item?.content || item?.text || ''))
            .filter(Boolean)
            .join('');
        const content = flattenAiText(message.content)
            || flattenAiText(choice.text)
            || flattenAiText(source.output_text)
            || outputText;
        const reasoning = flattenAiText(message.reasoning_content)
            || flattenAiText(message.reasoning)
            || flattenAiText(choice.reasoning_content)
            || flattenAiText(source.reasoning)
            || outputReasoning;
        const finishReason = String(choice.finish_reason || source.finish_reason || source.stop_reason || source.status || '');
        const structureParts = [
            '顶层=' + Object.keys(source).slice(0, 12).join(','),
            Object.keys(choice).length ? 'choice=' + Object.keys(choice).slice(0, 10).join(',') : '',
            Object.keys(message).length ? 'message=' + Object.keys(message).slice(0, 10).join(',') : '',
            outputItems.length ? 'output类型=' + outputItems.map(item => String(item?.type || 'unknown')).slice(0, 8).join(',') : ''
        ].filter(Boolean);
        return {
            content: String(content || ''),
            reasoning: String(reasoning || ''),
            finishReason,
            structureSummary: sanitizeAiDiagnosticText(structureParts.join('；'), 500)
        };
    }

    function getAiModelsEndpoint(endpoint) {
        try {
            const parsed = new URL(String(endpoint || ''));
            if (/\/chat\/completions\/?$/i.test(parsed.pathname)) {
                parsed.pathname = parsed.pathname.replace(/\/chat\/completions\/?$/i, '/models');
            } else if (/\/responses\/?$/i.test(parsed.pathname)) {
                parsed.pathname = parsed.pathname.replace(/\/responses\/?$/i, '/models');
            } else {
                parsed.pathname = '/v1/models';
            }
            parsed.search = '';
            parsed.hash = '';
            return parsed.href;
        } catch {
            return '';
        }
    }

    function requestAiTestStep({ method, endpoint, model, apiKey, timeout, phase, data }) {
        return new Promise(resolve => {
            const startedAt = Date.now();
            const headers = {};
            if (data !== undefined) headers['Content-Type'] = 'application/json';
            if (String(apiKey || '').trim()) headers.Authorization = 'Bearer ' + String(apiKey).trim();
            GM_xmlhttpRequest({
                method,
                url: endpoint,
                timeout,
                anonymous: true,
                headers,
                ...(data !== undefined ? { data: JSON.stringify(data) } : {}),
                onload: response => {
                    const responseText = String(response.responseText || '');
                    const diagnostics = buildAiDiagnostics(endpoint, model, phase, {
                        httpStatus: Number(response.status) || 0,
                        contentType: getHeader(response.responseHeaders, 'content-type'),
                        requestId: getHeader(response.responseHeaders, 'x-request-id')
                            || getHeader(response.responseHeaders, 'openai-request-id')
                            || getHeader(response.responseHeaders, 'request-id')
                            || getHeader(response.responseHeaders, 'cf-ray'),
                        responseBytes: responseText.length,
                        elapsedMs: Date.now() - startedAt
                    });
                    const ok = Number(response.status) >= 200 && Number(response.status) < 300;
                    resolve({
                        ok,
                        status: Number(response.status) || 0,
                        responseText,
                        error: ok ? '' : summarizeAiResponse(responseText),
                        diagnostics
                    });
                },
                onerror: error => resolve({
                    ok: false,
                    status: 0,
                    responseText: '',
                    error: '网络请求失败：' + sanitizeAiDiagnosticText(error?.error || error?.message || '未取得 HTTP 响应'),
                    diagnostics: buildAiDiagnostics(endpoint, model, phase + '网络错误', { elapsedMs: Date.now() - startedAt })
                }),
                ontimeout: () => resolve({
                    ok: false,
                    status: 0,
                    responseText: '',
                    error: '浏览器端请求超时（' + Math.round(timeout / 1000) + '秒）；请求已被本地取消，代理可能记录 HTTP 499/context canceled',
                    diagnostics: buildAiDiagnostics(endpoint, model, phase + '超时', { elapsedMs: Date.now() - startedAt })
                })
            });
        });
    }

    async function testAiConnection(config) {
        const endpoint = String(config?.endpoint || '').trim();
        const model = String(config?.model || '').trim();
        const apiKey = String(config?.apiKey || '').trim();
        const testTimeoutSeconds = Math.min(300, Math.max(30, Number(config?.testTimeoutSeconds) || 120));
        if (!isHttpUrl(endpoint)) return { ok: false, validationError: 'Endpoint 不是有效的 HTTP(S) 地址' };
        if (!model) return { ok: false, validationError: '请填写模型名' };
        if (!apiKey) return { ok: false, validationError: '请填写 API Key' };

        const modelsEndpoint = getAiModelsEndpoint(endpoint);
        const models = await requestAiTestStep({
            method: 'GET',
            endpoint: modelsEndpoint,
            model,
            apiKey,
            timeout: 10000,
            phase: '模型列表检查'
        });
        models.modelIds = [];
        models.targetListed = null;
        if (models.ok) {
            try {
                const payload = JSON.parse(models.responseText || '{}');
                const rows = Array.isArray(payload.data) ? payload.data : (Array.isArray(payload.models) ? payload.models : []);
                models.modelIds = rows.map(item => String(item?.id || item?.name || '')).filter(Boolean);
                if (models.modelIds.length) models.targetListed = models.modelIds.includes(model);
            } catch {
                models.parseWarning = '模型列表返回成功，但不是可识别的 JSON 格式';
            }
        }

        if (models.status === 401 || models.status === 403) {
            return { ok: false, models, chat: null, stoppedAfterModels: true };
        }

        const chat = await requestAiTestStep({
            method: 'POST',
            endpoint,
            model,
            apiKey,
            timeout: testTimeoutSeconds * 1000,
            phase: '短消息测试',
            data: {
                model,
                temperature: 0,
                max_tokens: 128,
                stream: false,
                messages: [
                    { role: 'system', content: '严格按用户要求，只输出最短答案。' },
                    { role: 'user', content: '只回复两个大写字母：OK' }
                ]
            }
        });
        if (chat.ok) {
            try {
                const payload = JSON.parse(chat.responseText || '{}');
                const extracted = extractAiResponse(payload);
                chat.content = extracted.content;
                chat.reasoning = extracted.reasoning;
                chat.finishReason = extracted.finishReason;
                chat.structureSummary = extracted.structureSummary;
                chat.diagnostics.finishReason = extracted.finishReason;
                chat.diagnostics.responseStructure = extracted.structureSummary;
                chat.routeOk = true;
                if (!chat.content.trim() && chat.reasoning.trim()) {
                    chat.ok = false;
                    chat.partial = true;
                    chat.routeOk = true;
                    chat.error = '接口与模型路由已连通，但本次只有推理内容，未产生最终文本';
                    chat.diagnostics.phase = '短消息仅有推理内容';
                } else if (!chat.content.trim()) {
                    chat.ok = false;
                    chat.partial = true;
                    chat.routeOk = true;
                    chat.error = '接口与模型路由成功，但响应中没有可识别的最终文本';
                    chat.diagnostics.phase = '短消息无最终文本';
                }
            } catch {
                chat.ok = false;
                chat.error = 'HTTP 成功，但响应不是有效 JSON';
                chat.diagnostics.phase = '短消息响应解析';
            }
        }
        return { ok: chat.ok, models, chat, stoppedAfterModels: false, testTimeoutSeconds };
    }

    function saveAiSnapshot(url, snapshot) {
        const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
        const fieldDecisions = source.fieldDecisions && typeof source.fieldDecisions === 'object'
            ? Object.fromEntries(Object.entries(source.fieldDecisions)
                .filter(([key, value]) => /^[a-f0-9]{8}$/i.test(key) && ['accepted', 'ignored'].includes(String(value)))
                .slice(0, 100))
            : {};
        GM_setValue(aiSnapshotKey(url), {
            sourceUrl: url,
            fingerprint: String(source.fingerprint || ''),
            status: String(source.status || ''),
            checkedAt: source.checkedAt || new Date().toISOString(),
            model: String(source.model || ''),
            excerpt: String(source.excerpt || ''),
            rates: source.rates && typeof source.rates === 'object' ? source.rates : {},
            error: String(source.error || ''),
            diagnostics: source.diagnostics && typeof source.diagnostics === 'object' ? source.diagnostics : null,
            previousData: source.previousData && typeof source.previousData === 'object' ? source.previousData : null,
            data: source.data && typeof source.data === 'object' ? source.data : null,
            evidenceText: String(source.evidenceText || '').slice(0, MAX_AI_EVIDENCE_CHARS),
            reviewPolicyVersion: Number(source.reviewPolicyVersion) || 0,
            fieldDecisions
        });
    }

    function getReusableAiData(url, fingerprint = '') {
        const snapshot = GM_getValue(aiSnapshotKey(url), null);
        if (!snapshot?.data || Number(snapshot.reviewPolicyVersion) !== 1) return null;
        if (!fingerprint || String(snapshot.fingerprint || '') !== String(fingerprint)) return null;
        return snapshot.data;
    }

    function normalizeCurrencyCode(value) {
        const raw = String(value || '').trim().toUpperCase();
        const aliases = {
            '$': 'USD', 'US$': 'USD', 'USD$': 'USD',
            '￥': 'CNY', '¥': 'CNY', 'RMB': 'CNY', 'CNH': 'CNY',
            '€': 'EUR', '£': 'GBP', '₩': 'KRW', '₹': 'INR', 'HK$': 'HKD', 'S$': 'SGD', 'A$': 'AUD', 'C$': 'CAD',
            '元': 'CNY', '日元': 'JPY', '韩元': 'KRW'
        };
        return aliases[raw] || raw || 'UNKNOWN';
    }

    function parseFxRates(value) {
        const rates = { CNY: 1 };
        String(value || '').split(/\r?\n/).forEach(line => {
            const match = line.trim().match(/^([A-Za-z]{3})\s*=\s*([0-9]+(?:\.[0-9]+)?)$/);
            if (!match) return;
            const code = normalizeCurrencyCode(match[1]);
            const rate = Number(match[2]);
            if (/^[A-Z]{3}$/.test(code) && Number.isFinite(rate) && rate > 0) rates[code] = rate;
        });
        return rates;
    }

    function currencySymbol(code) {
        return ({ CNY: '¥', USD: '$', EUR: '€', GBP: '£', JPY: '¥', KRW: '₩', INR: '₹', HKD: 'HK$', SGD: 'S$', AUD: 'A$', CAD: 'C$' })[code] || code;
    }

    function inferCurrency(text, url) {
        const source = String(text || '');
        const explicit = source.match(/(?:currency|currency\s*code|币种|价格单位|prices?\s+in|priced\s+in|billing\s+in|金额)\s*[:：]?\s*(USD|EUR|GBP|JPY|CNY|RMB|HKD|KRW|INR|AUD|CAD|SGD)\b/i)
            || source.match(/(?:currency|currency\s*code|币种|价格单位|金额)\s*[:：]?\s*(人民币|元)/i)
            || source.match(/(?:^|[^\w])(USD|EUR|GBP|JPY|CNY|RMB|HKD|KRW|INR|AUD|CAD|SGD)\s*(?=[0-9$€£¥￥])/i)
            || source.match(/[0-9][0-9,.]*\s*(USD|EUR|GBP|JPY|CNY|RMB|HKD|KRW|INR|AUD|CAD|SGD)\b/i)
            || source.match(/[0-9][0-9,.]*\s*(人民币|元)(?=[^\u4e00-\u9fff]|$)/i);
        if (explicit) return normalizeCurrencyCode(explicit[1]);
        if (/[€]/.test(source)) return 'EUR';
        if (/[£]/.test(source)) return 'GBP';
        if (/[₩]/.test(source)) return 'KRW';
        if (/[₹]/.test(source)) return 'INR';
        if (/HK\$/.test(source)) return 'HKD';
        if (/S\$/.test(source)) return 'SGD';
        if (/A\$/.test(source)) return 'AUD';
        if (/C\$/.test(source)) return 'CAD';
        if (/[¥￥]/.test(source)) {
            try {
                const host = new URL(url).hostname;
                if (host.endsWith('.jp') || host.includes('co.jp')) return 'JPY';
                if (host.endsWith('.cn') || host.includes('bigmodel') || host.includes('volcengine') || host.includes('baidu') || host.includes('aliyun') || host.includes('tencent') || host.includes('mimo.mi') || host.includes('kimi.com')) return 'CNY';
            } catch {}
            return 'UNKNOWN';
        }
        if (/\bUS\s*\$|\$/.test(source)) return 'USD';
        try {
            const host = new URL(url).hostname;
            if (host.endsWith('.cn') || host.includes('bigmodel') || host.includes('volcengine') || host.includes('baidu') || host.includes('aliyun') || host.includes('tencent') || host.includes('mimo.mi') || host.includes('kimi.com')) return 'CNY';
            if (host.endsWith('.jp')) return 'JPY';
            if (host.endsWith('.uk')) return 'GBP';
            if (host === 'github.com' || host.endsWith('.github.com') || host.endsWith('openai.com') || host.endsWith('x.ai') || host === 'grok.com') return 'USD';
        } catch {}
        return 'UNKNOWN';
    }

    function convertToCny(amount, currency, rates) {
        const value = Number(amount);
        const code = normalizeCurrencyCode(currency);
        return Number.isFinite(value) && rates[code] ? value * rates[code] : NaN;
    }

    function convertCurrency(amount, fromCurrency, toCurrency, rates) {
        const value = Number(amount);
        const from = normalizeCurrencyCode(fromCurrency);
        const to = normalizeCurrencyCode(toCurrency);
        if (!Number.isFinite(value)) return NaN;
        if (from === to) return value;
        const cny = convertToCny(value, from, rates);
        return Number.isFinite(cny) && rates[to] ? cny / rates[to] : NaN;
    }

    function extractPriceFacts(text, url) {
        const source = String(text || '');
        const settings = readAppSettings();
        const rates = parseFxRates(settings.currency.rates);
        const inferred = inferCurrency(source, url);
        const displayCurrency = rates[normalizeCurrencyCode(settings.currency.display)] ? normalizeCurrencyCode(settings.currency.display) : 'CNY';
        const facts = [];
        const seen = new Set();
        const patterns = [
            /(?:USD|US\$|(?<![A-Za-z])\$)\s*([0-9][0-9,.]*)/gi,
            /(?<![¥￥€£₩₹A-Za-z])([0-9][0-9,.]*)\s*(?:USD|US\$|\$)(?!\s*[0-9])/gi,
            /(?<![¥￥€£₩₹A-Za-z])([0-9][0-9,.]*)\s*(?:人民币|元)(?![A-Za-z])/gi,
            /(?<![¥￥€£₩₹A-Za-z])([0-9][0-9,.]*)\s*(?:EUR|GBP|JPY|CNY|RMB|HKD|KRW|INR|AUD|CAD|SGD)\b/gi,
            /(?:EUR|€)\s*([0-9][0-9,.]*)/gi,
            /(?:GBP|£)\s*([0-9][0-9,.]*)/gi,
            /(?:JPY|¥)\s*([0-9][0-9,.]*)/gi,
            /(?:CNY|RMB|￥|¥)\s*([0-9][0-9,.]*)/gi,
            /(?:HKD|HK\$)\s*([0-9][0-9,.]*)/gi,
            /(?:KRW|₩)\s*([0-9][0-9,.]*)/gi,
            /(?:SGD|S\$)\s*([0-9][0-9,.]*)/gi,
            /(?:CAD|C\$)\s*([0-9][0-9,.]*)/gi,
            /(?:AUD|A\$)\s*([0-9][0-9,.]*)/gi,
            /(?:INR|₹)\s*([0-9][0-9,.]*)/gi
        ];
        patterns.forEach(pattern => {
            for (const match of source.matchAll(pattern)) {
                const token = match[0].replace(/\s+/g, '');
                const amount = Number(String(match[1]).replace(/,/g, ''));
                const marker = token + '|' + amount;
                if (!Number.isFinite(amount) || seen.has(marker)) continue;
                seen.add(marker);
                let currency = inferCurrency(token, url);
                if (currency === 'UNKNOWN' && /[¥￥]/.test(token)) {
                    try {
                        const host = new URL(url).hostname;
                        if (host.endsWith('.jp') || host.includes('co.jp')) currency = 'JPY';
                        if (host.endsWith('.cn') || host.includes('bigmodel') || host.includes('volcengine') || host.includes('baidu') || host.includes('aliyun') || host.includes('tencent') || host.includes('mimo.mi') || host.includes('kimi.com')) currency = 'CNY';
                    } catch {}
                }
                if (currency === 'UNKNOWN' && !/[¥￥]/.test(token)) currency = inferred;
                facts.push({
                    raw: token,
                    amount,
                    currency,
                    amountCny: convertToCny(amount, currency, rates),
                    amountDisplay: convertCurrency(amount, currency, displayCurrency, rates)
                });
            }
        });
        return {
            inferredCurrency: inferred,
            displayCurrency,
            rates,
            prices: facts.slice(0, 30)
        };
    }

    function extractDeterministicFacts(text, url) {
        const source = String(text || '');
        const priceFacts = extractPriceFacts(source, url);
        const planNames = ['Lite', 'Essential', 'Standard', 'Pro', 'Pro+', 'Plus', 'Max', 'Heavy', 'Ultra', 'Team', 'Go'];
        const plans = planNames.filter(name => new RegExp('(^|[^A-Za-z])' + name.replace('+', '\\+') + '(?=$|[^A-Za-z])', 'i').test(source));
        const modelEvents = (source.match(/模型(?:新增|上线|下线|更新)/g) || []).length;
        const signals = [
            priceFacts.prices.length ? '价格 ' + priceFacts.prices.length + ' 项' : '',
            plans.length ? '套餐 ' + plans.join('、') : '',
            modelEvents ? '模型动态 ' + modelEvents + ' 条' : ''
        ].filter(Boolean);
        const confidence = source.length < 180 ? 'low' : (signals.length >= 2 ? 'medium' : 'low');
        return { ...priceFacts, plans, modelEvents, signals, confidence };
    }

    function buildAiExcerpt(text) {
        const source = sanitizeProbeText(text);
        if (source.length <= MAX_AI_EXCERPT_CHARS) return source;
        const keywords = /(价格|定价|套餐|额度|限额|积分|credits?|token|quota|monthly|yearly|模型|model|plan|price)/gi;
        const pieces = [];
        let match;
        while ((match = keywords.exec(source)) && pieces.join('\n').length < MAX_AI_EXCERPT_CHARS * 0.75) {
            const start = Math.max(0, match.index - 900);
            const end = Math.min(source.length, match.index + 2200);
            pieces.push(source.slice(start, end));
        }
        const joined = pieces.join('\n---\n');
        if (joined.length >= 1200) return joined.slice(0, MAX_AI_EXCERPT_CHARS);
        return (source.slice(0, 7000) + '\n---\n' + source.slice(-7000)).slice(0, MAX_AI_EXCERPT_CHARS);
    }

    function buildAiEvidencePacket(text, url, deterministicFacts = {}, maxChars = 9000) {
        const normalized = normalizeAiSourceText(text);
        const limit = Math.min(MAX_AI_EVIDENCE_CHARS, Math.max(4000, Number(maxChars) || 9000));
        if (!normalized) return '';

        // HTTP/渲染正文经常把导航、面包屑和脚注重复拼接多次；这里仅对发送给 AI 的副本去重。
        const noiseOnly = /^(首页|主页|菜单|导航|搜索|登录|注册|退出|帮助|关于我们|联系我们|隐私政策|服务条款|返回顶部|上一页|下一页|更多|展开|收起|share|sign\s*in|log\s*in|register|menu|search|home|next|previous|back|more)$/i;
        const segments = normalized
            .split(/\n+/)
            .flatMap(line => {
                const sentences = line.includes('|') ? [line] : line.replace(/([。！？；.!?;])[ \t]+/g, '$1\n').split(/\n+/);
                return sentences.flatMap(sentence => sentence
                    .replace(/[ \t]+(?=\b(?:Lite|Essential|Standard|Pro\+?|Plus|Max|Heavy|Ultra|Team|Go)\b)/gi, (spaces, offset, whole) => whole[offset - 1] === '|' ? spaces : '\n')
                    .split(/\n+/));
            })
            .map(item => item.trim())
            .filter(item => item.length >= 8 && !noiseOnly.test(item));
        const seenSegments = new Set();
        const source = segments.filter(item => {
            const fingerprint = item.replace(/[^\p{L}\p{N}]+/gu, '').toLowerCase();
            if (!fingerprint || seenSegments.has(fingerprint)) return false;
            seenSegments.add(fingerprint);
            return true;
        }).join('\n');
        if (!source) return '';

        const meta = [
            '[页面元信息]',
            '来源 URL：' + String(url || ''),
            deterministicFacts.inferredCurrency ? '确定性推断币种：' + deterministicFacts.inferredCurrency : '',
            Array.isArray(deterministicFacts.plans) && deterministicFacts.plans.length
                ? '检测到套餐词：' + deterministicFacts.plans.join('、')
                : '',
            Array.isArray(deterministicFacts.signals) && deterministicFacts.signals.length
                ? '确定性信号：' + deterministicFacts.signals.join('；')
                : ''
        ].filter(Boolean).join('\n');
        const directBudget = limit - meta.length - 80;
        if (source.length <= directBudget) {
            return (meta + '\n[页面正文（已标准化）]\n' + source).slice(0, limit);
        }

        const patterns = [
            { category: '模型 Token 预估', weight: 70, re: /模型(?:名称|名|ID)?|Model\s*ID|token|tokens|输入|输出|缓存|命中|未命中|预估|测算/gi },
            { category: '价格/套餐', weight: 60, re: /价格|定价|套餐|月付|年付|原价|优惠|订阅|Lite|Essential|Standard|Pro\+?|Plus|Max|Heavy|Ultra|Team|Go|¥|￥|元|CNY|RMB|USD|EUR|GBP|JPY|HKD/gi },
            { category: '额度/扣费规则', weight: 55, re: /额度|限额|限制|请求|次数|消息|Credits?|积分|扣费|消耗|抵扣|每周|每月|每天|5\s*小时|窗口|quota|monthly|weekly|daily/gi },
            { category: '正文证据', weight: 35, re: /规则|说明|可用|包含|支持|有效期|重置|模型|model|plan|price/gi }
        ];
        const candidates = [];
        patterns.forEach(item => {
            const re = new RegExp(item.re.source, 'gi');
            const matches = [];
            let match;
            while ((match = re.exec(source))) {
                matches.push(match.index);
                if (matches.length >= 2000) break;
            }
            const stride = Math.max(1, Math.ceil(matches.length / 90));
            matches.filter((_, index) => index % stride === 0 || index === matches.length - 1).forEach(matchIndex => {
                const start = Math.max(0, matchIndex - 240);
                const end = Math.min(source.length, matchIndex + 620);
                const snippet = source.slice(start, end).trim();
                if (snippet.length < 24) return;
                let score = item.weight;
                if (/\d/.test(snippet)) score += 12;
                if (/Lite|Essential|Standard|Pro\+?|Plus|Max|Heavy|Ultra|Team|Go/i.test(snippet)) score += 14;
                if (/token|tokens|输入|输出|模型|Model\s*ID/i.test(snippet)) score += 12;
                if (/元|¥|￥|CNY|RMB|USD|EUR|GBP|JPY|HKD/i.test(snippet)) score += 10;
                candidates.push({ category: item.category, start, end, snippet, score });
            });
        });

        const unique = [];
        const fingerprints = new Set();
        candidates.sort((a, b) => b.score - a.score || a.start - b.start);
        candidates.forEach(candidate => {
            const fingerprint = candidate.snippet.replace(/[^\p{L}\p{N}]+/gu, '').slice(0, 240);
            if (!fingerprint || fingerprints.has(fingerprint)) return;
            fingerprints.add(fingerprint);
            unique.push(candidate);
        });

        const selected = [];
        const categoryCounts = {};
        let used = meta.length + 80;
        unique.forEach(candidate => {
            if (selected.length >= 24) return;
            const categoryLimit = candidate.category === '模型 Token 预估' ? 8 : 6;
            if ((categoryCounts[candidate.category] || 0) >= categoryLimit) return;
            const overlaps = selected.some(item => {
                const overlap = Math.min(item.end, candidate.end) - Math.max(item.start, candidate.start);
                return overlap > Math.min(item.end - item.start, candidate.end - candidate.start) * 0.65;
            });
            if (overlaps) return;
            const labeled = '[' + candidate.category + ']\n' + candidate.snippet;
            if (used + labeled.length + 10 > limit) return;
            selected.push({ ...candidate, labeled });
            categoryCounts[candidate.category] = (categoryCounts[candidate.category] || 0) + 1;
            used += labeled.length + 10;
        });

        selected.sort((a, b) => a.start - b.start);
        const body = selected.map(item => item.labeled).join('\n---\n');
        if (!body) return (meta + '\n[页面正文（已截取）]\n' + source.slice(0, limit - meta.length - 40)).slice(0, limit);
        return (meta + '\n[筛选后的原文证据包]\n' + body + '\n[证据包结束：未列出的网页内容未发送给 AI]').slice(0, limit);
    }

    function parseJsonFromModelText(value) {
        const fence = String.fromCharCode(96).repeat(3);
        const raw = String(value || '').trim()
            .replace(new RegExp('^' + fence + '(?:json)?\\s*', 'i'), '')
            .replace(new RegExp('\\s*' + fence + '$'), '');
        try { return JSON.parse(raw); } catch {}
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start >= 0 && end > start) {
            try { return JSON.parse(raw.slice(start, end + 1)); } catch {}
        }
        return null;
    }

    function normalizeAiExtraction(value, rates) {
        const source = value && typeof value === 'object' ? value : {};
        const confidence = ['high', 'medium', 'low'].includes(String(source.confidence).toLowerCase())
            ? String(source.confidence).toLowerCase()
            : 'low';
        const prices = Array.isArray(source.prices) ? source.prices.slice(0, 20).map(item => {
            const row = item && typeof item === 'object' ? item : {};
            const amount = Number(row.amount);
            const currency = normalizeCurrencyCode(row.currency);
            const amountCny = Number.isFinite(amount) ? convertToCny(amount, currency, rates) : NaN;
            return {
                plan: String(row.plan || '未标注套餐').trim().slice(0, 120),
                amount: Number.isFinite(amount) ? amount : null,
                currency,
                billingPeriod: String(row.billingPeriod || 'unknown').trim().slice(0, 30),
                amountCny: Number.isFinite(amountCny) ? amountCny : null,
                evidence: String(row.evidence || '').trim().slice(0, MAX_AI_FIELD_EVIDENCE_CHARS)
            };
        }).filter(item => item.amount !== null) : [];
        const quotas = Array.isArray(source.quotas) ? source.quotas.slice(0, 30).map(item => {
            const row = item && typeof item === 'object' ? item : {};
            const numericValue = Number(row.value);
            return {
                plan: String(row.plan || '未标注套餐').trim().slice(0, 120),
                value: Number.isFinite(numericValue) ? numericValue : String(row.value || '').trim().slice(0, 80),
                unit: String(row.unit || 'unknown').trim().slice(0, 30),
                window: String(row.window || 'unknown').trim().slice(0, 30),
                evidence: String(row.evidence || '').trim().slice(0, MAX_AI_FIELD_EVIDENCE_CHARS)
            };
        }) : [];
        const modelEstimates = Array.isArray(source.modelEstimates) ? source.modelEstimates.slice(0, 40).map(item => {
            const row = item && typeof item === 'object' ? item : {};
            const numericValue = Number(row.estimatedTokens ?? row.value);
            return {
                plan: String(row.plan || '未标注套餐').trim().slice(0, 120),
                model: String(row.model || row.modelName || '未标注模型').trim().slice(0, 160),
                modelId: String(row.modelId || '').trim().slice(0, 160),
                estimatedTokens: Number.isFinite(numericValue) ? numericValue : String(row.estimatedTokens ?? row.value ?? '').trim().slice(0, 80),
                estimatedUnit: String(row.estimatedUnit || row.unit || 'unknown').trim().slice(0, 40),
                window: String(row.window || 'unknown').trim().slice(0, 30),
                basis: String(row.basis || '页面估算').trim().slice(0, 120),
                evidence: String(row.evidence || '').trim().slice(0, MAX_AI_FIELD_EVIDENCE_CHARS)
            };
        }).filter(item => item.model && item.estimatedTokens !== '') : [];
        return {
            confidence,
            needsReview: source.needsReview !== false,
            changeSummary: String(source.changeSummary || '').trim().slice(0, 500),
            pageCurrency: normalizeCurrencyCode(source.pageCurrency),
            prices,
            quotas,
            modelEstimates,
            models: Array.isArray(source.models) ? source.models.map(v => String(v).trim()).filter(Boolean).slice(0, 30) : [],
            warnings: Array.isArray(source.warnings) ? source.warnings.map(v => String(v).trim()).filter(Boolean).slice(0, 10) : []
        };
    }

    function requestAiExtraction(url, sourceResult, reason) {
        const settings = readAppSettings();
        const ai = settings.ai || {};
        const endpoint = String(ai.endpoint || '').trim();
        const model = String(ai.model || 'gpt-4o-mini');
        const timeoutSeconds = Math.min(300, Math.max(30, Number(ai.timeoutSeconds) || 120));
        if (!ai.enabled || !String(ai.apiKey || '').trim()) {
            return Promise.resolve({
                ok: false,
                skipped: true,
                error: 'AI 抽取未启用或未填写 API Key',
                diagnostics: buildAiDiagnostics(endpoint, model, '配置检查', { reason: 'AI 未启用或未填写 API Key' })
            });
        }
        if (!isHttpUrl(endpoint)) {
            return Promise.resolve({ ok: false, error: 'AI Endpoint 不是有效 HTTP(S) 地址', diagnostics: buildAiDiagnostics(endpoint, model, '配置检查') });
        }
        if (!sourceResult.aiReady) {
            return Promise.resolve({
                ok: false,
                skipped: true,
                error: '正文完整性校验未通过：' + (sourceResult.aiBlockReason || sourceResult.completeness?.reason || '正文不完整'),
                diagnostics: buildAiDiagnostics(endpoint, model, '请求前校验', {
                    reason: sourceResult.aiBlockReason || sourceResult.completeness?.reason || '正文不完整'
                })
            });
        }
        const sourceText = String(sourceResult.aiSourceText || sourceResult.snapshotText || sourceResult.preview || '');
        const evidenceLimit = Math.min(MAX_AI_EVIDENCE_CHARS, Math.max(4000, Number(ai.maxEvidenceChars) || 9000));
        const text = buildAiEvidencePacket(
            sourceText,
            url,
            sourceResult.extractFacts || extractDeterministicFacts(sourceText, url),
            evidenceLimit
        );
        const evidenceDiagnostics = {
            sourceChars: sourceText.length,
            evidenceChars: text.length
        };
        if (text.length < 120) return Promise.resolve({
            ok: false,
            skipped: true,
            error: '脚本预检查：正文少于 120 字，未发送 AI 请求',
                diagnostics: buildAiDiagnostics(endpoint, model, '请求前校验', { reason: '正文少于 120 字', ...evidenceDiagnostics })
        });
        const fx = parseFxRates(settings.currency.rates);
        const prompt = [
            '你是订阅与价格页面的数据审计器。请从下面脚本预处理后的官方页面证据包中抽取结构化数据。',
            '你收到的不是完整网页，而是脚本筛选后的证据包；只允许依据证据包中明确出现的内容。',
            '证据包中的标签用于说明片段类别，不代表脚本已经确认其含义；不要补全缺失表格或猜测未出现的数据。',
            '只允许依据正文明确出现的信息，不要猜测隐藏价格、Token容量、地区或套餐额度。',
            '金额必须保留页面原始币种；如果页面没有明确币种，返回 UNKNOWN，不要根据访问者IP猜币种。',
            'amountCny 可以省略；脚本会根据给定汇率在本地重新计算。不要为了填写 amountCny 重复解释金额。',
            '页面正文可能包含导航、营销文案、重复内容；请优先使用套餐表、价格表、额度表。',
            '额度的 value 与 unit 必须共同保留数量级：例如 100M Tokens 返回 value=100、unit="M tokens"，11B Tokens 返回 value=11、unit="B tokens"；不要把 M/B 丢掉。',
            'window 必须保留原始周期并尽量标准化为 monthly、weekly、daily、5h 等；同一套餐有月度和滚动窗口双重限制时，两项都要返回。',
            'Credits、积分、请求数和消息数不能猜测为 Token；分别使用 credits、points、requests、messages 等单位。',
            '如果页面提供“模型 × 套餐档位”的 Token 用量预估，必须单独放入 modelEstimates；这是按模型估算，不是固定套餐 Token，不要把不同模型相加。',
            'prices 最多返回 20 条，quotas 最多返回 30 条，modelEstimates 最多返回 40 条，models 最多返回 30 条，warnings 最多返回 10 条。',
            '每条 evidence 最多 220 字，必须逐字复制证据包中的原文，不得改写或自行补字。优先引用能包含数值、单位/币种和行标签的最短原文片段。若套餐名是表格列标题，不要把其他套餐的值拼进证据；准确填写 plan，并让 evidence 保留该数据行的原始单元格分隔符（如 |），脚本会根据抓取正文的表头和列位置核对套餐对应关系。只有原文没有可识别表格列关系时，才引用同时包含套餐名和目标数值的连续片段。只返回与价格、额度、模型或扣费规则直接相关的记录；相同模型和套餐不要重复返回。',
            '没有同时看到明确模型、套餐和 Token 数值时，不要生成 modelEstimates；请求次数、Credits、积分不能转成 Token。',
            '必须输出紧凑且完整的 JSON，确保最后一个字段和所有括号闭合。',
            '必须只返回 JSON，不要 Markdown 代码围栏。JSON 字段：',
            JSON.stringify({
                confidence: 'high|medium|low',
                needsReview: true,
                changeSummary: '本次页面变化的简短说明',
                pageCurrency: 'USD|EUR|GBP|JPY|CNY|HKD|KRW|UNKNOWN',
                prices: [{ plan: '套餐名', amount: 0, currency: 'USD', billingPeriod: 'monthly|yearly|one_time|unknown', evidence: '逐字复制的原文证据，保留对应表格行/列上下文' }],
                quotas: [{ plan: '套餐名', value: 0, unit: 'tokens|K tokens|M tokens|B tokens|requests|messages|credits|points|unknown', window: '5h|daily|weekly|monthly|unknown', evidence: '逐字复制的原文证据，保留对应表格行/列上下文' }],
                modelEstimates: [{ plan: '套餐档位', model: '模型名称', modelId: 'Model ID', estimatedTokens: 0, estimatedUnit: 'tokens|K tokens|万 tokens|M tokens|B tokens', window: 'monthly|weekly|daily|5h|unknown', basis: '官方页面估算/官方规则推算', evidence: '逐字复制的原文证据，保留对应表格行/列上下文' }],
                models: ['正文明确提及的模型'],
                warnings: ['币种、地区、登录态或页面不确定性']
            }),
            '当前显示币种设置：' + (settings.currency.display || 'CNY'),
            '汇率（1 外币 = 多少 CNY）：' + JSON.stringify(fx),
            '触发原因：' + reason,
            '来源 URL：' + url,
            '页面标题：' + (sourceResult.title || ''),
            '筛选后的 AI 证据包：',
            text
        ].join('\n');
        return new Promise(resolve => {
            const startedAt = Date.now();
            const headers = { 'Content-Type': 'application/json' };
            if (String(ai.apiKey).trim()) headers.Authorization = 'Bearer ' + String(ai.apiKey).trim();
            GM_xmlhttpRequest({
                method: 'POST',
                url: endpoint,
                timeout: timeoutSeconds * 1000,
                anonymous: true,
                headers,
                data: JSON.stringify({
                    model: String(ai.model || 'gpt-4o-mini'),
                    temperature: 0,
                    max_tokens: 4000,
                    messages: [
                        { role: 'system', content: '你只输出严格 JSON。' },
                        { role: 'user', content: prompt }
                    ]
                }),
                onload: response => {
                    const responseText = String(response.responseText || '');
                    const diagnostics = buildAiDiagnostics(endpoint, model, '收到响应', {
                        httpStatus: Number(response.status) || 0,
                        contentType: getHeader(response.responseHeaders, 'content-type'),
                        requestId: getHeader(response.responseHeaders, 'x-request-id')
                            || getHeader(response.responseHeaders, 'request-id')
                            || getHeader(response.responseHeaders, 'cf-ray'),
                        responseBytes: responseText.length,
                        elapsedMs: Date.now() - startedAt,
                        ...evidenceDiagnostics
                    });
                    if (Number(response.status) < 200 || Number(response.status) >= 300) {
                        resolve({ ok: false, error: 'AI HTTP ' + response.status + '：' + summarizeAiResponse(responseText), diagnostics: { ...diagnostics, ...evidenceDiagnostics } });
                        return;
                    }
                    diagnostics.sourceChars = sourceText.length;
                    diagnostics.evidenceChars = text.length;
                    try {
                        const payload = JSON.parse(responseText || '{}');
                        const extracted = extractAiResponse(payload);
                        const content = extracted.content;
                        diagnostics.finishReason = extracted.finishReason;
                        diagnostics.responseStructure = extracted.structureSummary;
                        const parsed = parseJsonFromModelText(content);
                        if (!parsed || typeof parsed !== 'object') {
                            const contentSummary = sanitizeAiDiagnosticText(content || extracted.reasoning || summarizeAiResponse(responseText));
                            const truncation = /^length$/i.test(extracted.finishReason) ? '；模型输出达到长度上限，JSON 未闭合' : '';
                            resolve({ ok: false, error: 'AI 返回不是有效 JSON' + truncation + '；模型输出摘要：' + contentSummary, diagnostics: { ...diagnostics, phase: '模型内容解析' } });
                            return;
                        }
                        const normalized = normalizeAiExtraction(parsed, fx);
                        resolve({
                            ok: true,
                            status: Number(response.status),
                            model: ai.model,
                            checkedAt: new Date().toISOString(),
                            needsReview: normalized.needsReview,
                            data: normalized,
                            evidenceText: text,
                            diagnostics
                        });
                    } catch {
                        resolve({ ok: false, error: 'AI 返回解析失败；响应摘要：' + summarizeAiResponse(responseText), diagnostics: { ...diagnostics, phase: '响应 JSON 解析' } });
                    }
                },
                onerror: error => resolve({ ok: false, error: 'AI 网络请求失败；' + sanitizeAiDiagnosticText(error?.error || error?.message || ''), diagnostics: buildAiDiagnostics(endpoint, model, '网络错误', { elapsedMs: Date.now() - startedAt, ...evidenceDiagnostics }) }),
                ontimeout: () => resolve({ ok: false, error: 'AI 请求超时（' + timeoutSeconds + '秒）', diagnostics: buildAiDiagnostics(endpoint, model, '请求超时', { elapsedMs: Date.now() - startedAt, timeoutSeconds, ...evidenceDiagnostics }) })
            });
        });
    }

    async function maybeRunAiExtraction(url, result, previous, forceAi = false, skipAutoAi = false) {
        const settings = readAppSettings();
        const previousAiExtraction = result.aiExtraction
            || getReusableAiData(url, previous?.fingerprint || '')
            || null;
        const markAiFailure = () => {
            if (previousAiExtraction) result.previousAiExtraction = previousAiExtraction;
            result.aiExtraction = null;
            result.aiCheckedAt = '';
            result.aiModel = '';
        };
        result.aiDiagnostics = null;
        if (!settings.ai.enabled) {
            if (forceAi) {
                markAiFailure();
                result.aiStatus = 'AI未执行：请先在“厂商配置”中启用 AI';
                result.aiDiagnostics = buildAiDiagnostics(settings.ai.endpoint, settings.ai.model, '配置检查', { reason: 'AI 未启用或未填写 API Key' });
                saveAiSnapshot(url, {
                    fingerprint: result.fingerprint,
                    status: '未执行',
                    checkedAt: new Date().toISOString(),
                    model: settings.ai.model,
                    excerpt: result.aiExcerpt || '',
                    rates: parseFxRates(settings.currency.rates),
                    error: '请先在“厂商配置”中启用 AI',
                    diagnostics: result.aiDiagnostics,
                    previousData: previousAiExtraction
                });
            }
            return result;
        }
        const hasPreviousComplete = Boolean(previous?.aiReady && previous?.fingerprint && previous?.snapshotText);
        const hasCurrentAi = Boolean(result.aiExtraction);
        const shouldRun = forceAi
            || (!skipAutoAi && Boolean(settings.ai.runOnFirstCheck && !hasCurrentAi && (result.changed || !hasPreviousComplete)));
        if (!shouldRun) return result;
        if (!result.ok || !result.aiReady) {
            if (forceAi || settings.ai.runOnFirstCheck) {
                markAiFailure();
                const reason = !result.ok
                    ? (result.error || '来源正文抓取失败')
                    : (result.aiBlockReason || result.completeness?.reason || '正文完整性校验未通过');
                result.aiStatus = 'AI未执行：' + reason + '，未发送请求';
                result.aiDiagnostics = buildAiDiagnostics(settings.ai.endpoint, settings.ai.model, '请求前校验', { reason });
                saveAiSnapshot(url, {
                    fingerprint: result.fingerprint,
                    status: '未执行',
                    checkedAt: new Date().toISOString(),
                    model: settings.ai.model,
                    excerpt: result.aiExcerpt || '',
                    rates: parseFxRates(settings.currency.rates),
                    error: reason + '，未发送请求',
                    diagnostics: result.aiDiagnostics,
                    previousData: previousAiExtraction
                });
            }
            return result;
        }
        const reason = forceAi
            ? '用户手动要求 AI 复核'
            : (result.changed ? '页面正文指纹发生变化' : '首次检查或确定性抽取置信度不足');
        const aiResult = await requestAiExtraction(url, result, reason);
        if (aiResult.ok) {
            result.aiExtraction = aiResult.data;
            delete result.previousAiExtraction;
            result.aiReused = false;
            result.aiStatus = 'AI提取完成，正在自动核验证据';
            result.aiCheckedAt = aiResult.checkedAt;
            result.aiModel = aiResult.model;
            result.aiDiagnostics = aiResult.diagnostics || null;
            saveAiSnapshot(url, {
                fingerprint: result.fingerprint || '',
                status: '自动筛选',
                reviewPolicyVersion: 1,
                fieldDecisions: {},
                checkedAt: aiResult.checkedAt,
                model: aiResult.model,
                excerpt: result.aiExcerpt || '',
                rates: parseFxRates(settings.currency.rates),
                data: aiResult.data,
                evidenceText: aiResult.evidenceText || '',
                diagnostics: aiResult.diagnostics || null
            });
        } else if (aiResult.skipped) {
            markAiFailure();
            result.aiStatus = 'AI未执行：' + aiResult.error;
            result.aiDiagnostics = aiResult.diagnostics || null;
            saveAiSnapshot(url, {
                fingerprint: result.fingerprint,
                status: '未执行',
                checkedAt: new Date().toISOString(),
                model: settings.ai.model,
                excerpt: result.aiExcerpt || '',
                rates: parseFxRates(settings.currency.rates),
                error: aiResult.error,
                diagnostics: aiResult.diagnostics || buildAiDiagnostics(settings.ai.endpoint, settings.ai.model, 'AI 未执行'),
                previousData: previousAiExtraction
            });
        } else {
            markAiFailure();
            result.aiStatus = 'AI失败：' + aiResult.error;
            result.aiDiagnostics = aiResult.diagnostics || null;
            saveAiSnapshot(url, {
                fingerprint: result.fingerprint,
                status: '失败',
                checkedAt: new Date().toISOString(),
                model: settings.ai.model,
                excerpt: result.aiExcerpt || '',
                rates: parseFxRates(settings.currency.rates),
                error: aiResult.error,
                diagnostics: aiResult.diagnostics || buildAiDiagnostics(settings.ai.endpoint, settings.ai.model, 'AI 调用失败'),
                previousData: previousAiExtraction
            });
        }
        return result;
    }

    function normalizeProbeText(text) {
        return String(text || '')
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, MAX_PROBE_BYTES);
    }

    function extractStructuredHtmlText(raw) {
        const html = String(raw || '');
        if (!html) return '';
        const prepared = html
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<\/(?:h[1-6]|p|div|section|article|main|header|footer|nav|li|ul|ol|tr|table|thead|tbody|tfoot|blockquote|pre|dl|dt|dd)>/gi, '\n')
            .replace(/<(?:br|hr)\b[^>]*>/gi, '\n')
            .replace(/<\/(?:td|th)>/gi, ' | ')
            .replace(/<[^>]+>/g, ' ');
        let decoded = prepared;
        try {
            const doc = new DOMParser().parseFromString('<textarea>' + prepared + '</textarea>', 'text/html');
            decoded = doc.querySelector('textarea')?.value || prepared;
        } catch {}
        return normalizeAiSourceText(decoded);
    }

    function normalizeAiSourceText(text) {
        return String(text || '')
            .replace(/\r\n?/g, '\n')
            .replace(/[ \t\f\v]+/g, ' ')
            .replace(/ *\n */g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/更新时间[：:]?\s*\d{4}[-/.年]\d{1,2}[-/.月]\d{1,2}(?:日)?(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?/g, '更新时间')
            .replace(/last updated[：:]?\s*[a-z0-9,:\- ]+/gi, 'last updated')
            .replace(/\b\d{4}-\d{2}-\d{2}t\d{2}:\d{2}:\d{2}(?:\.\d+)?z\b/gi, '')
            .trim()
            .slice(0, MAX_AI_SOURCE_CHARS);
    }

    function sanitizeProbeText(text) {
        return String(text || '')
            .replace(/更新时间[：:]?\s*\d{4}[-/.年]\d{1,2}[-/.月]\d{1,2}(?:日)?(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?/g, '更新时间')
            .replace(/last updated[：:]?\s*[a-z0-9,:\- ]+/gi, 'last updated')
            .replace(/\b\d{4}-\d{2}-\d{2}t\d{2}:\d{2}:\d{2}(?:\.\d+)?z\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function getHeader(headers, name) {
        const match = String(headers || '').match(new RegExp(`^${name}:\\s*(.+)$`, 'im'));
        return match ? match[1].trim() : '';
    }

    function getResponseText(response) {
        if (!response || typeof response !== 'object') return '';
        const text = typeof response.responseText === 'string' ? response.responseText : '';
        if (text) return text;
        if (typeof response.response === 'string') return response.response;
        const body = response.response;
        try {
            if (typeof TextDecoder !== 'undefined' && body instanceof ArrayBuffer) {
                return new TextDecoder('utf-8').decode(new Uint8Array(body));
            }
            if (typeof TextDecoder !== 'undefined' && ArrayBuffer.isView(body)) {
                return new TextDecoder('utf-8').decode(body);
            }
        } catch {}
        return '';
    }

    function getSourceProbeRule(url) {
        try {
            const parsed = new URL(url);
            if (parsed.hostname === 'api-docs.deepseek.com' && /\/quick_start\/pricing\/?$/.test(parsed.pathname)) {
                return {
                    mode: 'normal',
                    extractorId: 'deepseek-pricing',
                    selectors: ['main', 'article', '[class*="markdown"]', '[class*="docItemContainer"]', 'body'],
                    minLength: 800,
                    markers: []
                };
            }
            if (parsed.hostname === 'docs.volcengine.com') {
                return {
                    mode: 'rendered',
                    extractorId: 'volcengine-doc',
                    selectors: ['div[class*="contentdoc-"]', 'div[class*="content-CK"]', '[class*="markdown"]', 'main', 'article', '#app', 'body'],
                    minLength: 120,
                    markers: []
                };
            }
            if (parsed.hostname === 'docs.bigmodel.cn') {
                return {
                    mode: 'rendered',
                    extractorId: 'zhipu-coding-plan',
                    selectors: ['main', 'article', '[class*="markdown"]', '[class*="content"]', '#app', 'body'],
                    minLength: 200,
                    markers: []
                };
            }
            if (parsed.hostname === 'www.kimi.com' && /^\/code\/?$/.test(parsed.pathname)) {
                return {
                    mode: 'rendered',
                    extractorId: 'kimi-code-pricing',
                    selectors: ['.kfc-pricing-content', '[class*="pricing"]', '[class*="code"]', 'main', 'body'],
                    minLength: 120,
                    markers: []
                };
            }
            if (parsed.hostname === 'grok.com' && parsed.pathname.startsWith('/plans')) {
                return {
                    mode: 'rendered',
                    extractorId: 'grok-plans',
                    selectors: ['main', '[class*="plan"]', '[class*="pricing"]', 'body'],
                    minLength: 180,
                    markers: []
                };
            }
        } catch {
            return { mode: 'normal' };
        }
        return { mode: 'normal' };
    }

    function getSourceCompletenessProfile(url) {
        try {
            const parsed = new URL(url);
            if (parsed.hostname === 'api-docs.deepseek.com' && /\/quick_start\/pricing\/?$/.test(parsed.pathname)) {
                return {
                    name: 'DeepSeek 定价表',
                    minLength: 800,
                    minimumMarkers: 4,
                    markerGroups: [
                        { label: '模型名称', pattern: /deepseek-[a-z0-9._-]+/i },
                        { label: '计价单位', pattern: /百万\s*tokens?/i },
                        { label: '缓存命中价格', pattern: /缓存命中/i },
                        { label: '缓存未命中价格', pattern: /缓存未命中/i },
                        { label: '输出价格', pattern: /百万\s*tokens?输出|输出[^。]{0,80}(?:元|CNY|RMB)/i },
                        { label: '币种金额', pattern: /\d+(?:\.\d+)?\s*(?:元|CNY|RMB)/i },
                        { label: '时段价格', pattern: /空闲时段[\s\S]{0,300}高峰时段|高峰时段[\s\S]{0,300}空闲时段/i }
                    ]
                };
            }
        } catch {}
        return { name: '通用页面', minLength: 240, minimumMarkers: 0, markerGroups: [] };
    }

    function assessSourceCompleteness(url, text, probe = {}) {
        const source = sanitizeProbeText(text || '');
        const profile = getSourceCompletenessProfile(url);
        const blocked = /access denied|forbidden|just a moment|enable cookies|verify you are human|captcha|安全验证|人机验证|登录后查看|请先登录/i.test(source);
        const missing = profile.markerGroups
            .filter(group => !group.pattern.test(source))
            .map(group => group.label);
        const matchedMarkers = profile.markerGroups.length - missing.length;
        const useful = /价格|定价|套餐|额度|限额|积分|credits?|tokens?|quota|monthly|yearly|模型|model|plan|price|订阅|更新|发布/i.test(source);
        const lengthEnough = source.length >= profile.minLength;
        const markersEnough = matchedMarkers >= Math.max(1, Number(profile.minimumMarkers) || profile.markerGroups.length);
        const structurallyUsable = profile.markerGroups.length ? markersEnough : useful;
        const complete = Boolean(probe.ok && !blocked && lengthEnough && structurallyUsable && !probe.uncomparable);
        let reason = '';
        if (!probe.ok) reason = probe.error || '来源抓取失败';
        else if (blocked) reason = '页面命中登录墙、验证码或访问限制';
        else if (!lengthEnough) reason = '正文仅 ' + source.length.toLocaleString() + ' 字，低于 ' + profile.minLength.toLocaleString() + ' 字完整性基准';
        else if (!markersEnough) reason = '关键结构信号不足，缺少：' + missing.join('、');
        else if (!useful) reason = '正文中未识别到价格、套餐或更新信息';
        else if (probe.uncomparable) reason = probe.error || '正文不可比较';
        const facts = probe.extractFacts || {};
        const signalCount = Array.isArray(facts.signals) ? facts.signals.length : 0;
        const priceCount = Array.isArray(facts.prices) ? facts.prices.length : 0;
        const score = (probe.ok ? 1000 : 0)
            + (complete ? 5000 : 0)
            + (!probe.weak ? 600 : 0)
            + (!probe.uncomparable ? 300 : 0)
            + Math.min(source.length, 20000) / 10
            + signalCount * 120
            + priceCount * 20
            - (blocked ? 4000 : 0);
        return {
            complete,
            profile: profile.name,
            minLength: profile.minLength,
            textLength: source.length,
            matchedMarkers,
            totalMarkers: profile.markerGroups.length,
            missing,
            reason: complete ? '' : (reason || '正文完整性不足'),
            score
        };
    }

    function applySourceAssessment(result, url) {
        const target = result && typeof result === 'object' ? result : {};
        target.completeness = assessSourceCompleteness(url, target.snapshotText || target.preview || '', target);
        target.aiReady = Boolean(target.ok && !target.weak && !target.uncomparable && target.completeness.complete);
        target.aiBlockReason = target.aiReady ? '' : (target.completeness.reason || target.error || '正文不完整');
        return target;
    }

    function chooseBetterProbe(primary, fallback, url) {
        const first = applySourceAssessment(primary || {}, url);
        const second = applySourceAssessment(fallback || {}, url);
        if (!fallback) return first;
        return Number(second.completeness?.score || 0) > Number(first.completeness?.score || 0) ? second : first;
    }

    function looksLikeDynamicShell(raw, body) {
        const html = String(raw || '');
        const visible = String(body || '');
        const shellSignal = /<script[^>]+src=|id=["'](?:app|root|__next)["']|__NEXT_DATA__|enable javascript|javascript is required|正在加载|loading\.\.\./i.test(html);
        const usefulSignal = /价格|定价|套餐|额度|限额|积分|token|quota|monthly|yearly|model|plan|price|订阅|更新|发布/i.test(visible);
        return visible.length < 1200 && shellSignal && !usefulSignal;
    }

    function requestUpdateCheck(url, previous, requestOptions = {}) {
        return new Promise(resolve => {
            if (!isHttpUrl(url)) {
                resolve({ ok: false, status: 0, error: '非有效 URL' });
                return;
            }
            const headers = { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' };
            if (!requestOptions.forceFresh) {
                if (previous?.etag) headers['If-None-Match'] = previous.etag;
                if (previous?.lastModified) headers['If-Modified-Since'] = previous.lastModified;
            }

            GM_xmlhttpRequest({
                method: 'GET',
                url,
                timeout: 12000,
                anonymous: true,
                headers,
                onload: res => {
                    const raw = getResponseText(res);
                    const title = (raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
                    const body = sanitizeProbeText(normalizeProbeText(raw));
                    const aiSourceText = extractStructuredHtmlText(raw) || body;
                    const status = Number(res.status) || 0;
                    if (status === 304) {
                        const previousText = sanitizeProbeText(previous?.snapshotText || '');
                        if (previousText.length < 180 && !requestOptions.forceFresh) {
                            requestUpdateCheck(url, previous, { ...requestOptions, forceFresh: true }).then(resolve);
                            return;
                        }
                        resolve({
                            ok: true, status, statusText: res.statusText || '',
                            fingerprint: previous?.fingerprint || '',
                            etag: previous?.etag || '', lastModified: previous?.lastModified || '',
                            title: previous?.title || '', bytes: 0, textLength: previous?.textLength || 0,
                            snapshotText: previous?.snapshotText || '',
                            aiSourceText: previous?.aiSourceText || previous?.snapshotText || '',
                            aiExcerpt: previous?.aiExcerpt || '',
                            preview: previous?.preview || '',
                            extractFacts: previous?.extractFacts || null,
                            aiExtraction: null,
                            aiStatus: '',
                            weak: previousText.length < 180,
                            checkedAt: new Date().toISOString(), changed: false, notModified: true,
                            error: previousText.length < 180 ? '服务器返回 304，但缓存正文仍不足' : ''
                        });
                        return;
                    }
                    resolve({
                        ok: status >= 200 && status < 400,
                        status, statusText: res.statusText || '',
                        fingerprint: body ? hashText(body) : '',
                        etag: getHeader(res.responseHeaders, 'etag'),
                        lastModified: getHeader(res.responseHeaders, 'last-modified'),
                        title: title.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
                        bytes: raw.length, textLength: body.length,
                        snapshotText: body,
                        aiSourceText,
                        preview: body.slice(0, 500),
                        extractFacts: extractDeterministicFacts(body, url),
                        weak: body.length < 180 || looksLikeDynamicShell(raw, body),
                        checkedAt: new Date().toISOString(),
                        error: status >= 200 && status < 400
                            ? (raw ? '' : `HTTP ${status}，响应正文为空`)
                            : `HTTP ${status}`
                    });
                },
                onerror: () => resolve({ ok: false, status: 0, error: '网络错误或拒绝连接' }),
                ontimeout: () => resolve({ ok: false, status: 0, error: '请求超时（12秒）' })
            });
        });
    }

    function extractEmbeddedRenderedText() {
        const pieces = [];
        try {
            document.querySelectorAll('meta[name="description"], meta[property="og:description"]').forEach(node => {
                const content = String(node.getAttribute('content') || '').trim();
                if (content) pieces.push(content);
            });
            document.querySelectorAll('script#__NEXT_DATA__, script[type="application/ld+json"], script[type="application/json"]').forEach(node => {
                const raw = String(node.textContent || '').trim();
                if (!raw) return;
                try {
                    const parsed = JSON.parse(raw);
                    pieces.push(JSON.stringify(parsed));
                } catch {
                    pieces.push(raw.slice(0, 100000));
                }
            });
        } catch {}
        return sanitizeProbeText(pieces.join('\n')).slice(0, MAX_PROBE_BYTES);
    }

    function extractRenderedNodeText(node) {
        if (!node) return '';
        let hasTable = false;
        try { hasTable = Boolean(node.matches?.('table, [role="table"], [role="grid"]') || node.querySelector('table, [role="table"], [role="grid"]')); } catch {}
        if (!hasTable) return String(node.innerText || node.textContent || '').trim();
        let clone;
        try { clone = node.cloneNode(true); } catch { return String(node.innerText || node.textContent || '').trim(); }
        const tables = [];
        if (clone.matches?.('table, [role="table"], [role="grid"]')) tables.push(clone);
        try { tables.push(...clone.querySelectorAll('table, [role="table"], [role="grid"]')); } catch {}
        let rootTableText = '';
        const depth = element => {
            let value = 0;
            for (let parent = element.parentElement; parent; parent = parent.parentElement) value++;
            return value;
        };
        tables.sort((a, b) => depth(b) - depth(a)).forEach(table => {
            let rows = [];
            if (table.matches('table')) {
                rows = Array.from(table.rows || []).map(row => Array.from(row.cells || []).map(cell => String(cell.innerText || cell.textContent || '').replace(/\s+/g, ' ').trim()));
            } else {
                rows = Array.from(table.querySelectorAll('[role="row"]'))
                    .filter(row => row.closest('[role="table"], [role="grid"]') === table)
                    .map(row => Array.from(row.querySelectorAll('[role="columnheader"], [role="rowheader"], [role="cell"], [role="gridcell"]'))
                        .filter(cell => cell.closest('[role="row"]') === row)
                        .map(cell => String(cell.innerText || cell.textContent || '').replace(/\s+/g, ' ').trim()));
            }
            const tableText = rows.filter(row => row.some(cell => cell)).map(row => row.join(' | ')).join('\n');
            if (!tableText) return;
            if (table === clone) {
                rootTableText = '[表格]\n' + tableText + '\n[/表格]';
                return;
            }
            try {
                const pre = (table.ownerDocument || document).createElement('pre');
                pre.textContent = '[表格]\n' + tableText + '\n[/表格]';
                table.replaceWith(pre);
            } catch {}
        });
        return rootTableText || String(clone.innerText || clone.textContent || '').trim();
    }

    function extractRenderedText(rule) {
        const selectors = rule.selectors?.length ? rule.selectors : ['main', 'article', '[role="main"]', 'body'];
        const candidates = [];
        selectors.forEach(sel => {
            try {
                document.querySelectorAll(sel).forEach(node => {
                    const text = String(node.innerText || node.textContent || '').trim();
                    if (text) candidates.push({ node, text });
                });
            } catch {}
        });
        try {
            document.querySelectorAll('iframe').forEach(frame => {
                try {
                    const frameDoc = frame.contentDocument;
                    if (!frameDoc) return;
                    const frameText = String(frameDoc.body?.innerText || frameDoc.body?.textContent || '').trim();
                    if (frameText) candidates.push({ node: frameDoc.body, text: frameText });
                } catch {}
            });
        } catch {}
        const longest = candidates.sort((a, b) => b.text.length - a.text.length)[0];
        const rendered = longest ? extractRenderedNodeText(longest.node) : '';
        const embedded = extractEmbeddedRenderedText();
        return normalizeAiSourceText([rendered, embedded].filter(Boolean).join('\n')).slice(0, MAX_PROBE_BYTES);
    }

    function captureRenderedSourceIfRequested() {
        const match = String(location.hash || '').match(/(?:^|[&#])llm-codeplans-probe=([a-f0-9]{8})/i);
        if (!match) return;
        const reqKey = RENDER_REQUEST_KEY_PREFIX + match[1];
        const req = GM_getValue(reqKey, null);
        if (!req || req.state !== 'pending') return;

        const rule = req.rule || {};
        const minLength = Math.max(80, Number(rule.minLength) || 120);
        const startedAt = Date.now();
        let lastText = '', stableRounds = 0;

        const collect = () => {
            const text = extractRenderedText(rule);
            stableRounds = text && text === lastText ? stableRounds + 1 : 0;
            lastText = text;
            const blocked = /access denied|forbidden|just a moment|enable cookies|verify you are human|captcha|安全验证|人机验证/i.test(text);
            const enough = text.length >= minLength && !blocked;
            const timedOut = Date.now() - startedAt > 30000;
            const pageAccessible = document.readyState !== 'loading' && !blocked;
            const ok = enough || (timedOut && pageAccessible);

            if ((!enough || stableRounds < 2) && !timedOut) {
                setTimeout(collect, 500);
                return;
            }
            GM_setValue(reqKey, {
                state: 'done',
                ok,
                weak: !enough,
                uncomparable: Boolean(ok && !enough),
                error: enough ? '' : (blocked ? '命中安全验证' : (pageAccessible ? '页面可访问；动态渲染，未取得可比较正文' : '有效正文不足 ' + minLength + ' 字')),
                checkedAt: new Date().toISOString(),
                title: document.title,
                textLength: text.length,
                fingerprint: text ? hashText(text) : '',
                snapshotText: text,
                aiSourceText: text,
                preview: text.slice(0, 500),
                extractFacts: extractDeterministicFacts(text, location.href)
            });
            setTimeout(() => window.close(), 300);
        };
        setTimeout(collect, 700);
    }

    function requestRenderedSource(url, previous, rule) {
        return new Promise(resolve => {
            const id = hashText(url + '|' + Date.now() + '|' + Math.random().toString(36).slice(2));
            const reqKey = RENDER_REQUEST_KEY_PREFIX + id;
            const src = new URL(url);
            src.hash = src.hash ? src.hash + '&llm-codeplans-probe=' + id : 'llm-codeplans-probe=' + id;

            GM_setValue(reqKey, {
                state: 'pending',
                sourceUrl: url,
                requestedAt: new Date().toISOString(),
                rule: {
                    extractorId: rule.extractorId || 'generic',
                    selectors: rule.selectors || ['main', 'article', 'body'],
                    minLength: rule.minLength || 120
                }
            });

            let tab;
            try {
                tab = GM_openInTab(src.href, { active: false, insert: true, setParent: true });
            } catch (err) {
                resolve({ ok: false, error: '无法启动后台采集标签页：' + (err.message || err) });
                return;
            }

            const startedAt = Date.now();
            const poll = () => {
                const res = GM_getValue(reqKey, null);
                if (res && res.state === 'done') {
                    if (tab && typeof tab.close === 'function') tab.close();
                    resolve({
                        ...res,
                        rendered: true,
                        weak: res.weak !== undefined ? Boolean(res.weak) : !res.ok,
                        uncomparable: Boolean(res.uncomparable),
                        changed: Boolean(res.ok && previous?.fingerprint && previous.fingerprint !== res.fingerprint),
                        previousCheckedAt: previous?.checkedAt || ''
                    });
                    return;
                }
                if (Date.now() - startedAt > 36000) {
                    if (tab && typeof tab.close === 'function') tab.close();
                    GM_setValue(reqKey, { state: 'expired', sourceUrl: url, checkedAt: new Date().toISOString(), error: '采集超时（36秒），本次后台采集请求已过期' });
                    resolve({ ok: false, rendered: true, expired: true, error: '采集超时（36秒），本次后台采集请求已过期' });
                    return;
                }
                setTimeout(poll, 500);
            };
            setTimeout(poll, 500);
        });
    }

    async function probeSource(url, requestOptions = {}) {
        const storedPrevious = GM_getValue(sourceKey(url), null);
        const previous = storedPrevious
            ? applySourceAssessment({ ...storedPrevious }, url)
            : null;
        const rule = getSourceProbeRule(url);
        let result = rule.mode === 'rendered'
            ? await requestRenderedSource(url, previous, rule)
            : await requestUpdateCheck(url, previous, requestOptions);
        result = applySourceAssessment(result, url);

        if (rule.mode !== 'rendered' && (!result.ok || result.weak || !result.completeness?.complete) && typeof GM_openInTab === 'function') {
            const renderedRule = { ...rule, mode: 'rendered', minLength: Math.max(120, Number(rule.minLength) || 120) };
            const fallbackRes = await requestRenderedSource(url, previous, renderedRule);
            result = chooseBetterProbe(result, fallbackRes, url);
        }

        // 手动 AI 复核必须以这次重新抓到的结果为准，不能把上次 AI 结果混进本次失败状态。
        if (requestOptions.forceAi) {
            result.aiExtraction = null;
            result.aiStatus = '';
            result.aiCheckedAt = '';
            result.aiModel = '';
            result.aiReused = false;
        }

        result.probeMode = result.rendered ? 'rendered' : rule.mode;
        if (result.snapshotText) {
            result.snapshotText = sanitizeProbeText(result.snapshotText).slice(0, MAX_PROBE_BYTES);
            result.aiSourceText = normalizeAiSourceText(result.aiSourceText || result.snapshotText);
            result.aiExcerpt = buildAiExcerpt(result.snapshotText);
        }
        if (!result.extractFacts && result.snapshotText) result.extractFacts = extractDeterministicFacts(result.snapshotText, url);
        result = applySourceAssessment(result, url);
        const hasPreviousComplete = Boolean(previous?.aiReady && previous?.fingerprint && previous?.snapshotText);
        result.firstComplete = Boolean(result.aiReady && !hasPreviousComplete);
        result.changed = Boolean(result.aiReady && hasPreviousComplete && previous.fingerprint !== result.fingerprint);
        result.sourceUrl = url;
        result.compareAvailable = Boolean(result.aiReady && hasPreviousComplete && result.fingerprint);
        const previousAiExtraction = getReusableAiData(url, previous?.fingerprint || '');
        if (!requestOptions.forceAi && !result.aiExtraction && hasPreviousComplete && !result.changed && result.aiReady) {
            result.aiExtraction = previousAiExtraction;
            result.previousAiExtraction = null;
            result.aiStatus = previousAiExtraction ? 'AI数据已自动筛选' : '';
            result.aiCheckedAt = previous.aiCheckedAt || '';
            result.aiModel = previous.aiModel || '';
            result.aiReused = Boolean(previousAiExtraction);
        } else if (!requestOptions.forceAi && previous && (result.changed || !result.aiReady)) {
            result.aiExtraction = null;
            result.previousAiExtraction = previousAiExtraction;
            result.aiCheckedAt = '';
            result.aiModel = '';
            result.aiReused = false;
            result.aiStatus = result.changed
                ? 'AI未复核：正文发生变化'
                : 'AI未复核：本次正文完整性校验未通过';
            saveAiSnapshot(url, {
                fingerprint: result.fingerprint,
                status: '未复核',
                checkedAt: new Date().toISOString(),
                excerpt: result.aiExcerpt || '',
                rates: parseFxRates(readAppSettings().currency.rates),
                error: result.aiStatus,
                previousData: previousAiExtraction
            });
        }
        result = await maybeRunAiExtraction(
            url,
            result,
            previous,
            Boolean(requestOptions.forceAi),
            Boolean(requestOptions.skipAutoAi)
        );
        if (result.ok && result.aiReady) {
            result.previousCheckedAt = previous?.checkedAt || '';
            GM_setValue(sourceKey(url), result);
            return result;
        }
        if (result.ok && !result.aiReady && previous) {
            const retained = { ...previous };
            const aiAttemptNeedsReview = /^AI(?:失败|未执行|未复核)/.test(String(result.aiStatus || ''));
            retained.lastError = result.error || '本次正文不足，保留上次可比较记录';
            retained.lastAttemptAt = new Date().toISOString();
            retained.aiStatus = result.aiStatus || retained.aiStatus || '';
            retained.previousAiExtraction = aiAttemptNeedsReview
                ? (result.previousAiExtraction || retained.aiExtraction || retained.previousAiExtraction || null)
                : (result.previousAiExtraction || retained.previousAiExtraction || null);
            retained.aiExtraction = aiAttemptNeedsReview ? null : (result.aiExtraction || retained.aiExtraction || null);
            retained.aiCheckedAt = aiAttemptNeedsReview ? '' : (result.aiCheckedAt || retained.aiCheckedAt || '');
            retained.aiModel = aiAttemptNeedsReview ? '' : (result.aiModel || retained.aiModel || '');
            retained.currentProbe = makeCurrentProbe(result, {
                aiExtraction: aiAttemptNeedsReview ? null : (result.aiExtraction || null),
                previousAiExtraction: result.previousAiExtraction || null
            });
            GM_setValue(sourceKey(url), retained);
            return {
                ...retained,
                attemptFailed: true,
                attemptError: retained.lastError,
                uncomparable: Boolean(result.uncomparable),
                aiStatus: result.aiStatus || retained.aiStatus || '',
                aiExtraction: aiAttemptNeedsReview ? null : (result.aiExtraction || retained.aiExtraction || null),
                previousAiExtraction: result.previousAiExtraction || retained.previousAiExtraction || null,
                currentProbe: retained.currentProbe
            };
        }
        const retained = previous ? { ...previous } : {};
        const aiAttemptNeedsReview = /^AI(?:失败|未执行|未复核)/.test(String(result.aiStatus || ''));
        retained.lastError = result.error || '检查失败';
        retained.lastAttemptAt = new Date().toISOString();
        retained.aiStatus = result.aiStatus || retained.aiStatus || '';
        retained.previousAiExtraction = aiAttemptNeedsReview
            ? (result.previousAiExtraction || retained.aiExtraction || retained.previousAiExtraction || null)
            : (result.previousAiExtraction || retained.previousAiExtraction || null);
        retained.aiExtraction = aiAttemptNeedsReview ? null : (result.aiExtraction || retained.aiExtraction || null);
        retained.aiCheckedAt = aiAttemptNeedsReview ? '' : (result.aiCheckedAt || retained.aiCheckedAt || '');
        retained.aiModel = aiAttemptNeedsReview ? '' : (result.aiModel || retained.aiModel || '');
        retained.currentProbe = makeCurrentProbe(result, {
            aiExtraction: aiAttemptNeedsReview ? null : (result.aiExtraction || null),
            previousAiExtraction: result.previousAiExtraction || null
        });
        GM_setValue(sourceKey(url), retained);
        return {
            ...retained,
            ...(previous ? {} : { ok: false, error: retained.lastError }),
            attemptFailed: true,
            attemptError: retained.lastError,
            currentProbe: retained.currentProbe
        };
    }

    function makeCurrentProbe(result, overrides = {}) {
        const source = result && typeof result === 'object' ? result : {};
        return {
            ok: Boolean(source.ok),
            status: Number(source.status) || 0,
            statusText: String(source.statusText || ''),
            error: String(source.error || ''),
            weak: Boolean(source.weak),
            uncomparable: Boolean(source.uncomparable),
            rendered: Boolean(source.rendered),
            probeMode: String(source.probeMode || ''),
            sourceUrl: String(source.sourceUrl || ''),
            title: String(source.title || ''),
            bytes: Number(source.bytes) || 0,
            textLength: Number(source.textLength) || 0,
            fingerprint: String(source.fingerprint || ''),
            snapshotText: String(source.snapshotText || ''),
            aiSourceText: String(source.aiSourceText || source.snapshotText || ''),
            aiExcerpt: String(source.aiExcerpt || ''),
            preview: String(source.preview || ''),
            extractFacts: source.extractFacts && typeof source.extractFacts === 'object' ? source.extractFacts : null,
            completeness: source.completeness && typeof source.completeness === 'object' ? source.completeness : null,
            aiReady: Boolean(source.aiReady),
            aiBlockReason: String(source.aiBlockReason || ''),
            compareAvailable: Boolean(source.compareAvailable),
            changed: Boolean(source.changed),
            notModified: Boolean(source.notModified),
            checkedAt: source.checkedAt || new Date().toISOString(),
            aiStatus: String(overrides.aiStatus ?? source.aiStatus ?? ''),
            aiExtraction: overrides.aiExtraction !== undefined ? overrides.aiExtraction : (source.aiExtraction || null),
            previousAiExtraction: overrides.previousAiExtraction !== undefined
                ? overrides.previousAiExtraction
                : (source.previousAiExtraction || null),
            aiCheckedAt: String(source.aiCheckedAt || ''),
            aiModel: String(source.aiModel || ''),
            aiReused: Boolean(source.aiReused),
            aiDiagnostics: overrides.aiDiagnostics !== undefined
                ? overrides.aiDiagnostics
                : (source.aiDiagnostics && typeof source.aiDiagnostics === 'object' ? source.aiDiagnostics : null)
        };
    }

    function probeSummary(probe) {
        if (!probe) return { label: '未检查', color: '#8b949e' };
        const displayProbe = getProbeDisplay(probe);
        const isRetained = Boolean(probe.currentProbe || probe.attemptFailed);
        const len = Number(displayProbe.textLength || displayProbe.bytes || 0).toLocaleString();
        const checkedAt = formatDate(displayProbe.checkedAt);
        const facts = displayProbe.extractFacts && displayProbe.extractFacts.signals && displayProbe.extractFacts.signals.length
            ? '；' + displayProbe.extractFacts.signals.join('，')
            : '';

        if (isRetained) {
            const reason = displayProbe.error
                || displayProbe.aiBlockReason
                || displayProbe.completeness?.reason
                || (displayProbe.uncomparable ? '页面可访问，但正文不可比较' : (displayProbe.weak ? '本次正文过短或不完整' : '本次检查失败'));
            const current = '本次' + (displayProbe.ok ? '正文不完整' : '检查失败') + '：' + reason + ' · ' + len + ' 字（' + checkedAt + '）';
            const retained = displayProbe.retainedCheckedAt
                ? `；沿用上次成功记录（${formatDate(displayProbe.retainedCheckedAt)}）`
                : '';
            return { label: current + retained, color: displayProbe.ok ? '#e3b341' : '#f85149' };
        }
        if (!displayProbe.ok) return { label: '失败：' + (displayProbe.error || '未知错误'), color: '#f85149' };
        if (displayProbe.uncomparable) return { label: (displayProbe.error || '页面可访问；动态渲染，未取得可比较正文') + '（' + checkedAt + '）', color: '#e3b341' };
        if (displayProbe.error && Number(displayProbe.textLength || 0) === 0) return { label: displayProbe.error + '（' + checkedAt + '）', color: '#e3b341' };
        if (displayProbe.changed) return { label: `页面发生更新（${checkedAt}）`, color: '#e3b341' };
        if (displayProbe.weak) return { label: `内容过短（${checkedAt}）`, color: '#e3b341' };
        const rendered = displayProbe.rendered
            ? (displayProbe.compareAvailable ? '动态渲染，已比较正文' : '动态渲染，已保存正文；首次无历史可比')
            : '静态正文';
        return { label: rendered + ' · ' + len + ' 字' + facts + '（' + checkedAt + '）', color: '#3fb950' };
    }

    function formatAiSnapshot(snapshot) {
        if (!snapshot || !snapshot.data) return '';
        const data = snapshot.data;
        const prices = Array.isArray(data.prices) ? data.prices.slice(0, 4).map(item => {
            const amount = Number(item.amount);
            const currency = normalizeCurrencyCode(item.currency);
            const raw = Number.isFinite(amount) ? currencySymbol(currency) + amount : currency;
            const cny = Number(item.amountCny);
            return item.plan ? item.plan + ' ' + raw + (Number.isFinite(cny) && currency !== 'CNY' ? '≈¥' + cny.toFixed(0) : '') : raw;
        }) : [];
        const changes = String(data.changeSummary || '').trim();
        const quotas = Array.isArray(data.quotas) ? data.quotas.slice(0, 3).map(item => {
            const value = item.value === undefined || item.value === null ? '' : item.value;
            return item.plan + ' ' + value + ' ' + (item.unit || '') + '/' + (item.window || '');
        }) : [];
        const estimates = Array.isArray(data.modelEstimates) ? data.modelEstimates.slice(0, 3).map(item => {
            const value = item.estimatedTokens === undefined || item.estimatedTokens === null ? '' : item.estimatedTokens;
            return item.plan + ' · ' + item.model + ' ' + value + ' ' + (item.estimatedUnit || '') + '/' + (item.window || '');
        }) : [];
        const warnings = Array.isArray(data.warnings) ? data.warnings.slice(0, 2).join('、') : '';
        const pieces = [];
        if (prices.length) pieces.push('价格 ' + prices.join('、'));
        if (quotas.length) pieces.push('额度 ' + quotas.join('、'));
        if (estimates.length) pieces.push('按模型估算 ' + estimates.join('、'));
        if (changes) pieces.push(changes);
        if (data.pageCurrency) pieces.push('页面币种 ' + normalizeCurrencyCode(data.pageCurrency));
        if (data.confidence) pieces.push('置信度 ' + data.confidence);
        if (warnings) pieces.push('注意 ' + warnings);
        return pieces.join('；') || '本次未提取到可展示的价格或额度字段';
    }

    function formatProviderAiStatus(snapshot) {
        if (!snapshot) return '';
        const status = String(snapshot.status || '').trim();
        if (snapshot.data) {
            const review = getAiSnapshotReview(snapshot);
            if (review.unsupported) return '旧版 AI 结果已停用，请重新抓取分析';
            const applied = review.counts.automatic + review.counts.accepted;
            const reviewLabel = review.counts.pending
                ? '已自动采用 ' + applied + ' 项，' + review.counts.pending + ' 项证据异常待处理'
                : review.counts.ignored && !applied
                    ? '异常字段已忽略，未用于测算'
                    : '已自动筛选并采用 ' + applied + ' 项' + (review.counts.ignored ? '，另忽略 ' + review.counts.ignored + ' 项' : '');
            return '最近 AI 结果（' + reviewLabel + '）：' + formatAiSnapshot({ data: review.data });
        }
        if (status === '失败' || status === '未执行' || status === '未复核') {
            const cleanError = String(snapshot.error || '')
                .replace(/^AI(?:失败|未执行|未复核)\s*[:：]?\s*/i, '')
                .trim();
            const reason = cleanError ? '：' + cleanError : '';
            const previous = snapshot.previousData
                ? '；上次成功结果：' + formatAiSnapshot({ data: snapshot.previousData })
                : '';
            return '最近 AI ' + status + reason + previous;
        }
        return '';
    }

    function getAiReviewState(probe) {
        if (!probe) return { kind: 'none', label: 'AI状态：尚未检查', color: '#8b949e' };
        const displayProbe = getProbeDisplay(probe);
        if (!displayProbe.ok && !displayProbe.aiExtraction) return { kind: 'unavailable', label: 'AI状态：暂不可执行（请先解决来源抓取失败）', color: '#f85149' };
        const status = String(displayProbe.aiStatus || '').trim();
        const snapshot = displayProbe.sourceUrl ? GM_getValue(aiSnapshotKey(displayProbe.sourceUrl), null) : null;
        if (/^AI失败/.test(status) || snapshot?.status === '失败') {
            const diagnostics = displayProbe.aiDiagnostics || snapshot?.diagnostics || null;
            const suffix = diagnostics?.httpStatus ? 'HTTP ' + diagnostics.httpStatus : (diagnostics?.phase || '可重试');
            return { kind: 'unavailable', label: 'AI调用失败（' + suffix + '）', color: '#f85149' };
        }
        if (/^AI未执行/.test(status)) {
            const reason = /完整性校验|正文过短|正文不足|正文少于\s*120|缺少关键字段/.test(status)
                ? '正文完整性校验未通过，未发送请求'
                : (/(?:未启用|Key|Endpoint)/i.test(status) ? 'AI 未启用或未配置' : '未满足执行条件');
            return { kind: 'unavailable', label: 'AI未执行（' + reason + '）', color: '#f85149' };
        }
        const aiData = displayProbe.aiExtraction || snapshot?.data || null;
        if (aiData) {
            const reviewSnapshot = snapshot?.data ? snapshot : {
                ...(snapshot || {}),
                fingerprint: displayProbe.fingerprint || '',
                excerpt: displayProbe.aiExcerpt || buildAiExcerpt(displayProbe.snapshotText || ''),
                data: aiData
            };
            const review = getAiSnapshotReview(reviewSnapshot);
            if (review.unsupported) return { kind: 'action', label: '旧版 AI 数据已停用，请重新抓取分析', color: '#e3b341' };
            const applied = review.counts.automatic + review.counts.accepted;
            if (review.counts.pending) {
                return { kind: 'attention', label: 'AI数据：' + applied + ' 项已自动采用；' + review.counts.pending + ' 项证据异常待处理', color: '#e3b341' };
            }
            if (review.counts.ignored && !applied) return { kind: 'ignored', label: 'AI数据：异常字段已忽略，未用于测算', color: '#8b949e' };
            return { kind: 'ready', label: 'AI数据：已自动筛选并采用 ' + applied + ' 项', color: '#3fb950' };
        }
        if (!displayProbe.aiReady) {
            const reason = displayProbe.aiBlockReason || displayProbe.completeness?.reason || '正文完整性校验未通过';
            return { kind: 'unavailable', label: 'AI暂不可执行（' + reason + '）', color: '#f85149' };
        }
        const facts = displayProbe.extractFacts || {};
        if (displayProbe.changed || displayProbe.weak || displayProbe.uncomparable || !Array.isArray(facts.signals) || !facts.signals.length || /^AI未复核/.test(status)) {
            const ai = readAppSettings().ai || {};
            if (!ai.enabled || !String(ai.apiKey || '').trim() || !isHttpUrl(ai.endpoint)) {
                return { kind: 'unavailable', label: '建议运行 AI 分析，但尚未配置 AI', color: '#e3b341' };
            }
            return { kind: 'action', label: '建议运行 AI 分析（页面有变化或缺少可识别数据）', color: '#e3b341' };
        }
        return { kind: 'optional', label: 'AI分析：当前页面无变化', color: '#8b949e' };
    }

    function applyAiReviewButtonState(button, probe) {
        if (!button) return;
        const state = getAiReviewState(probe);
        const action = state.kind === 'action';
        button.textContent = action ? '建议运行 AI分析' : 'AI重新抓取分析';
        button.title = state.label + '；点击后会重新抓取正文';
        button.style.borderColor = action ? '#d29922' : '';
    }

    function formatAiDiagnostics(diagnostics) {
        if (!diagnostics || typeof diagnostics !== 'object') return '';
        const parts = [
            diagnostics.checkedAt ? '时间 ' + formatDate(diagnostics.checkedAt) : '',
            diagnostics.phase ? '阶段 ' + diagnostics.phase : '',
            diagnostics.httpStatus ? 'HTTP ' + diagnostics.httpStatus : '',
            diagnostics.endpointHost ? '接口 ' + diagnostics.endpointHost + (diagnostics.endpointPath || '/') : '',
            diagnostics.model ? '模型 ' + diagnostics.model : '',
            diagnostics.contentType ? '类型 ' + diagnostics.contentType : '',
            diagnostics.requestId ? '请求ID ' + diagnostics.requestId : '',
            diagnostics.finishReason ? '结束原因 ' + diagnostics.finishReason : '',
            diagnostics.responseStructure ? '结构 ' + diagnostics.responseStructure : '',
            Number.isFinite(Number(diagnostics.responseBytes)) ? '响应 ' + Number(diagnostics.responseBytes).toLocaleString() + ' 字节' : '',
            Number.isFinite(Number(diagnostics.elapsedMs)) ? '耗时 ' + Number(diagnostics.elapsedMs).toLocaleString() + ' ms' : '',
            Number.isFinite(Number(diagnostics.sourceChars)) ? '原始正文 ' + Number(diagnostics.sourceChars).toLocaleString() + ' 字' : '',
            Number.isFinite(Number(diagnostics.evidenceChars)) ? '证据包 ' + Number(diagnostics.evidenceChars).toLocaleString() + ' 字' : '',
            diagnostics.reason ? '原因 ' + diagnostics.reason : ''
        ].filter(Boolean);
        return parts.join('；');
    }

    function explainAiDiagnostics(diagnostics) {
        if (!diagnostics || typeof diagnostics !== 'object') return '';
        const status = Number(diagnostics.httpStatus) || 0;
        const phase = String(diagnostics.phase || '');
        if (phase === '请求前校验') return '请求未发送：请先解决正文完整性问题';
        if (phase === '配置检查') return '请求未发送：请检查 AI 开关、API Key 与 Endpoint';
        if (/网络错误$/.test(phase)) return '请求未取得 HTTP 响应：检查网络、代理、DNS、跨域连接策略或接口可达性';
        if (/超时$/.test(phase)) return '接口在限定时间内没有完成响应：可稍后重试或检查服务状态';
        if (status === 400) return '请求已到达接口：通常是模型名、请求字段或接口格式不兼容';
        if (status === 401) return '请求已到达接口：通常是 API Key 无效、过期或 Authorization 格式不对';
        if (status === 403) return '请求已到达接口：通常是账号权限、模型权限、地区/IP 或接口策略限制';
        if (status === 404) return '请求已到达服务器：通常是 Endpoint 路径或模型名错误';
        if (status === 408) return '服务端请求超时，可稍后重试';
        if (status === 429) return '请求已到达接口：通常是限流、余额不足或配额耗尽';
        if (status >= 500) return '接口服务端异常，可稍后重试并检查服务状态';
        if (status >= 200 && status < 300 && diagnostics.phase === '模型内容解析' && /^length$/i.test(String(diagnostics.finishReason || ''))) return 'API 调用成功，但模型输出达到长度上限，JSON 没有完整闭合；可减少证据包或再次复核';
        if (status >= 200 && status < 300 && diagnostics.phase === '模型内容解析') return 'API 调用成功，但模型内容不是脚本要求的 JSON';
        if (status >= 200 && status < 300 && diagnostics.phase === '响应 JSON 解析') return 'API 返回成功状态，但响应格式不是兼容的 JSON';
        return '';
    }

    function formatAiProbeDetail(probe, sourceUrl = '') {
        const displayProbe = getProbeDisplay(probe);
        if (!displayProbe) return '';
        const resolvedUrl = displayProbe.sourceUrl || sourceUrl || probe?.sourceUrl || '';
        const snapshot = resolvedUrl ? GM_getValue(aiSnapshotKey(resolvedUrl), null) : null;
        const diagnostics = displayProbe.aiDiagnostics || snapshot?.diagnostics || null;
        const diagnosticText = formatAiDiagnostics(diagnostics);
        const diagnosticAdvice = explainAiDiagnostics(diagnostics);
        const aiStatus = String(displayProbe.aiStatus || '').trim();
        const snapshotStatus = String(snapshot?.status || '').trim();
        const effectiveStatus = aiStatus || snapshotStatus;
        const aiFailed = /^AI失败/.test(aiStatus) || (!aiStatus && snapshotStatus === '失败');
        const aiNotExecuted = /^AI未执行/.test(aiStatus) || (!aiStatus && snapshotStatus === '未执行');
        const failureText = aiFailed
            ? String(/^AI失败/.test(aiStatus) ? aiStatus.replace(/^AI失败\s*[:：]?\s*/, '') : (snapshot?.error || '')).trim()
            : '';
        const stateText = aiFailed ? '' : effectiveStatus;
        const parts = [];
        let exceptionPanel = '';
        let diagnosticPanel = '';
        const aiData = displayProbe.aiExtraction || snapshot?.data || null;
        if (aiData) {
            const label = displayProbe.aiReused || displayProbe.notModified ? '同一正文版本的历史 AI 结果：' : '本次 AI 结果：';
            const reviewSnapshot = snapshot?.data ? snapshot : {
                ...(snapshot || {}),
                sourceUrl: resolvedUrl,
                fingerprint: displayProbe.fingerprint || '',
                excerpt: displayProbe.aiExcerpt || buildAiExcerpt(displayProbe.snapshotText || ''),
                data: aiData
            };
            const review = getAiSnapshotReview(reviewSnapshot);
            const fingerprint = String(reviewSnapshot.fingerprint || '');
            const fieldActionButton = (action, key, text, styleClass = '') => '<button type="button" class="llm-btn llm-ai-field-action ' + styleClass + '" data-ai-field-action="' + action + '" data-ai-field-key="' + escapeHtml(key || '') + '" data-ai-field-url="' + escapeHtml(resolvedUrl) + '" data-ai-field-fingerprint="' + escapeHtml(fingerprint) + '">' + text + '</button>';
            if (review.unsupported) {
                parts.push(label + '旧版 AI 结果已停用，请重新抓取分析。旧版结果不会用于测算。');
            } else {
                const summary = 'AI数据筛选：自动采用 ' + review.counts.automatic + ' 项'
                    + (review.counts.accepted ? '；按你的选择采用 ' + review.counts.accepted + ' 项异常数据' : '')
                    + (review.counts.ignored ? '；已忽略 ' + review.counts.ignored + ' 项' : '')
                    + (review.counts.pending ? '；' + review.counts.pending + ' 项异常未纳入测算' : '');
                parts.push(label + escapeHtml(formatAiSnapshot({ data: review.data })) + '；' + escapeHtml(summary));
                if (review.exceptions.length) {
                    const statusText = exception => exception.decision === 'accepted'
                        ? '<span class="llm-ai-exception-accepted">已按你的选择采用（仍有疑点）</span>'
                        : exception.decision === 'ignored'
                            ? '<span class="llm-ai-exception-ignored">已忽略，本项未用于测算</span>'
                            : '<span class="llm-ai-exception-pending">未自动采用</span>';
                    const exceptionRows = review.exceptions.map(exception => {
                        const item = exception.item || {};
                        const title = exception.type === 'price'
                            ? (item.plan || '未标注套餐') + ' · ' + currencySymbol(item.currency) + String(item.amount ?? '未知')
                            : exception.type === 'quota'
                                ? (item.plan || '未标注套餐') + ' · ' + String(item.value ?? '未知') + ' ' + String(item.unit || '') + '/' + String(item.window || '周期未知')
                                : (item.plan || '未标注套餐') + ' · ' + String(item.model || '未标注模型') + ' · ' + String(item.estimatedTokens ?? '未知') + ' ' + String(item.estimatedUnit || '') + '/' + String(item.window || '周期未知');
                        let actions = '';
                        if (exception.decision === 'accepted') actions = fieldActionButton('ignore', exception.key, '撤回采用');
                        else if (exception.decision === 'ignored') actions = fieldActionButton('reopen', exception.key, '重新处理');
                        else actions = fieldActionButton('accept', exception.key, '仍采用此值', 'llm-ai-field-primary') + fieldActionButton('ignore', exception.key, '忽略本次');
                        return '<div class="llm-ai-exception-item"><div class="llm-ai-exception-item-head"><strong>' + escapeHtml(title) + '</strong>' + statusText(exception) + '</div>'
                            + '<div class="llm-ai-exception-reason">' + escapeHtml(exception.issues.join('；')) + '</div>'
                            + '<div class="llm-ai-exception-evidence">页面证据：' + escapeHtml(item.evidence || 'AI 未提供原文证据') + '</div>'
                            + '<div class="llm-ai-exception-actions">' + actions + '</div></div>';
                    }).join('');
                    exceptionPanel = '<details class="llm-ai-exception-panel" ' + (review.counts.pending ? 'open' : '') + '><summary>数据异常 ' + review.exceptions.length + ' 项（待处理 ' + review.counts.pending + '）</summary><div class="llm-ai-exception-list">' + exceptionRows + '</div></details>';
                }
            }
        }
        if (aiFailed && failureText) {
            parts.push('<span style="color:#f85149;">AI错误：' + escapeHtml(failureText) + '</span>');
        } else if (aiNotExecuted && stateText && diagnosticText) {
            parts.push('AI状态：' + escapeHtml(stateText));
        }
        const hasAiIssue = aiFailed || aiNotExecuted || /未复核/.test(effectiveStatus) || Boolean(diagnosticAdvice);
        if (diagnosticText && hasAiIssue) {
            const copyText = 'AI诊断：' + diagnosticText
                + (diagnosticAdvice ? '\n初步判断：' + diagnosticAdvice : '')
                + (stateText ? '\nAI状态：' + stateText : '')
                + (failureText ? '\nAI错误：' + failureText : '');
            diagnosticPanel = '<div class="llm-ai-diagnostics-panel"><div class="llm-ai-diagnostics-heading">复核遇到问题，可复制诊断信息排查</div><div>AI诊断：' + escapeHtml(diagnosticText) + '</div>'
                + (diagnosticAdvice ? '<div>初步判断：' + escapeHtml(diagnosticAdvice) + '</div>' : '')
                + '<button type="button" class="llm-btn llm-copy-ai-diagnostics" data-ai-diagnostics="' + escapeHtml(copyText) + '">复制 AI 诊断</button></div>';
        }
        return parts.join('；') + exceptionPanel + diagnosticPanel;
    }

    function getProbeDisplay(probe) {
        if (!probe || !probe.currentProbe || typeof probe.currentProbe !== 'object') return probe;
        const current = probe.currentProbe;
        const hasCurrent = key => Object.prototype.hasOwnProperty.call(current, key);
        return {
            ...probe,
            ...current,
            ok: current.ok !== undefined ? Boolean(current.ok) : Boolean(probe.ok),
            weak: current.weak !== undefined ? Boolean(current.weak) : true,
            uncomparable: current.uncomparable !== undefined ? Boolean(current.uncomparable) : true,
            rendered: current.rendered !== undefined ? Boolean(current.rendered) : false,
            bytes: Number(current.bytes) || 0,
            textLength: Number(current.textLength) || 0,
            sourceUrl: String(current.sourceUrl || ''),
            fingerprint: String(current.fingerprint || ''),
            aiSourceText: String(current.aiSourceText || current.snapshotText || ''),
            extractFacts: current.extractFacts && typeof current.extractFacts === 'object' ? current.extractFacts : null,
            completeness: current.completeness && typeof current.completeness === 'object' ? current.completeness : null,
            aiReady: hasCurrent('aiReady') ? Boolean(current.aiReady) : false,
            aiBlockReason: hasCurrent('aiBlockReason') ? String(current.aiBlockReason || '') : '',
            changed: hasCurrent('changed') ? Boolean(current.changed) : false,
            compareAvailable: hasCurrent('compareAvailable') ? Boolean(current.compareAvailable) : false,
            notModified: hasCurrent('notModified') ? Boolean(current.notModified) : false,
            aiStatus: hasCurrent('aiStatus') ? String(current.aiStatus || '') : '',
            aiExtraction: hasCurrent('aiExtraction') ? (current.aiExtraction || null) : null,
            previousAiExtraction: hasCurrent('previousAiExtraction') ? (current.previousAiExtraction || null) : null,
            aiReused: hasCurrent('aiReused') ? Boolean(current.aiReused) : false,
            aiDiagnostics: hasCurrent('aiDiagnostics')
                ? (current.aiDiagnostics && typeof current.aiDiagnostics === 'object' ? current.aiDiagnostics : null)
                : (probe.aiDiagnostics && typeof probe.aiDiagnostics === 'object' ? probe.aiDiagnostics : null),
            checkedAt: current.checkedAt || probe.lastAttemptAt || '',
            lastError: '',
            attemptFailed: true,
            attemptError: current.error || probe.lastError || '本次检查未取得可靠正文',
            retainedCheckedAt: probe.checkedAt || ''
        };
    }

    function getProviderAiSnapshot(provider) {
        const links = [...getUsableLinks(provider, 'pricing'), ...getUsableLinks(provider, 'rules'), ...getUsableLinks(provider, 'updates')];
        const snapshots = links.map(link => GM_getValue(aiSnapshotKey(link.url), null)).filter(Boolean);
        snapshots.sort((a, b) => String(b.checkedAt || '').localeCompare(String(a.checkedAt || '')));
        return snapshots[0] || null;
    }

    function normalizePlanKey(value) {
        return String(value || '')
            .toLowerCase()
            .replace(/\+/g, ' plus ')
            .replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ')
            .trim();
    }

    function planMatches(left, right) {
        const a = normalizePlanKey(left);
        const b = normalizePlanKey(right);
        if (!a || !b || a === '未标注套餐' || b === '未标注套餐') return false;
        if (a === b) return true;
        const tierWords = new Set(['free', 'go', 'lite', 'essential', 'standard', 'pro', 'plus', 'max', 'heavy', 'ultra', 'team']);
        const tiersOf = value => value.split(/\s+/).filter(word => tierWords.has(word)).join(' ');
        const aTiers = tiersOf(a);
        const bTiers = tiersOf(b);
        if (aTiers !== bTiers && (aTiers || bTiers)) return false;
        if (a.length >= 3 && b.includes(a)) return true;
        if (b.length >= 3 && a.includes(b)) return true;
        const aWords = a.split(/\s+/).filter(word => word.length >= 2);
        const bWords = new Set(b.split(/\s+/));
        return aWords.some(word => bWords.has(word));
    }

    function monthlyMultiplier(windowValue) {
        const value = String(windowValue || '').trim().toLowerCase();
        if (!value || value === 'unknown') return NaN;
        if (/month|monthly|月/.test(value)) return 1;
        if (/week|weekly|周|7\s*(?:d|day|天)/.test(value)) return 52 / 12;
        if (/year|yearly|annual|年/.test(value)) return 1 / 12;
        const hours = value.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:h|hour|小时)/);
        if (hours) return (365 * 24 / 12) / Number(hours[1]);
        const days = value.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:d|day|天)/);
        if (days) return (365 / 12) / Number(days[1]);
        if (/day|daily|日|天/.test(value)) return 365 / 12;
        return NaN;
    }

    function quotaUnitKind(unit) {
        const value = String(unit || '').trim().toLowerCase();
        if (/b\s*token|billion|十亿/.test(value)) return 'b-tokens';
        if (/m\s*token|million|百万/.test(value)) return 'm-tokens';
        if (/k\s*token|thousand|千/.test(value)) return 'k-tokens';
        if (/万\s*token|ten[- ]?thousand/.test(value)) return 'wan-tokens';
        if (/token/.test(value)) return 'tokens';
        if (/request|call|message|次|请求|消息/.test(value)) return 'requests';
        if (/credit|point|积分|点数|额度点/.test(value)) return 'credits';
        return 'unknown';
    }

    function aiBaseUnitKind(unit) {
        const kind = quotaUnitKind(unit);
        return kind.endsWith('tokens') ? 'tokens' : kind;
    }

    function parseQuotaValue(value, unit) {
        if (typeof value === 'number') return { value, unit: String(unit || '') };
        const raw = String(value || '').replace(/,/g, '').trim();
        const match = raw.match(/^([0-9]+(?:\.[0-9]+)?)\s*([KMB])?$/i);
        if (!match) return { value: NaN, unit: String(unit || '') };
        const numericValue = Number(match[1]);
        const suffix = String(match[2] || '').toUpperCase();
        let normalizedUnit = String(unit || '');
        if (suffix && /token|credit|request/i.test(normalizedUnit) && !/\b[KMB]\s*(?:tokens?|credits?|requests?)/i.test(normalizedUnit)) {
            normalizedUnit = suffix + ' ' + normalizedUnit;
        }
        return { value: numericValue, unit: normalizedUnit };
    }

    function normalizeAiEvidenceText(value) {
        return String(value || '').normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}_]+/gu, '');
    }

    function aiFieldKey(type, item) {
        const values = type === 'price'
            ? [type, normalizePlanKey(item.plan), item.amount, normalizeCurrencyCode(item.currency), item.billingPeriod]
            : type === 'quota'
                ? [type, normalizePlanKey(item.plan), item.value, item.unit, item.window]
                : [type, normalizePlanKey(item.plan), normalizePlanKey(item.modelId || item.model), item.estimatedTokens, item.estimatedUnit, item.window];
        return hashText(JSON.stringify(values.map(value => String(value ?? ''))));
    }

    function aiEvidenceContainsPlan(plan, evidence) {
        const planKey = normalizePlanKey(plan);
        if (!planKey || planKey === '未标注套餐') return false;
        const evidenceKey = normalizePlanKey(evidence);
        const tierNames = ['free', 'go', 'lite', 'essential', 'standard', 'pro', 'plus', 'max', 'heavy', 'ultra', 'team'];
        const planTiers = planKey.split(/\s+/).filter(word => tierNames.includes(word));
        if (planTiers.length) {
            const evidenceWords = evidenceKey.split(/\s+/);
            return evidenceWords.some((_, index) => planTiers.every((word, tierIndex) => evidenceWords[index + tierIndex] === word));
        }
        const compactPlan = normalizeAiEvidenceText(plan);
        return compactPlan.length >= 2 && normalizeAiEvidenceText(evidence).includes(compactPlan);
    }

    function aiEvidenceContainsValue(type, item, evidence) {
        if (type === 'price') {
            const amount = Number(item.amount);
            return Number.isFinite(amount) && aiNumbersInText(evidence).some(value => Math.abs(value - amount) <= Math.max(1e-8, Math.abs(amount) * 1e-8));
        }
        const parsed = type === 'quota'
            ? parseQuotaValue(item.value, item.unit)
            : parseQuotaValue(item.estimatedTokens, item.estimatedUnit);
        const metric = Number.isFinite(parsed.value) ? parsed.value * aiUnitScale(parsed.unit) : NaN;
        const kind = aiBaseUnitKind(parsed.unit);
        return Number.isFinite(metric) && kind !== 'unknown'
            && aiEvidenceQuantities(evidence).some(value => value.kind === kind && Math.abs(value.value - metric) <= Math.max(1e-8, Math.abs(metric) * 1e-6));
    }

    function aiSourceTableSupportsPlan(plan, evidence, sourceText, type, item) {
        const quote = normalizeAiEvidenceText(evidence);
        if (!quote || !aiEvidenceContainsValue(type, item, evidence)) return false;
        const rows = String(sourceText || '').split(/\n+/)
            .map(line => line.split('|').map(cell => cell.trim()))
            .filter(cells => cells.length >= 2 && cells.some(Boolean));
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            const dataRow = rows[rowIndex];
            const rowQuoteMatches = normalizeAiEvidenceText(dataRow.join(' | ')).includes(quote);
            const valueColumns = dataRow.map((cell, index) => ({ cell, index }))
                .filter(({ cell }) => (rowQuoteMatches || normalizeAiEvidenceText(cell).includes(quote)) && aiEvidenceContainsValue(type, item, cell))
                .map(({ index }) => index);
            if (!valueColumns.length) continue;
            for (let headerIndex = Math.max(0, rowIndex - 4); headerIndex < rowIndex; headerIndex++) {
                const header = rows[headerIndex];
                if (header.length !== dataRow.length) continue;
                const tierCount = header.filter(cell => ['free', 'go', 'lite', 'essential', 'standard', 'pro', 'plus', 'max', 'heavy', 'ultra', 'team']
                    .some(tier => aiEvidenceContainsPlan(tier, cell))).length;
                if (tierCount < 2) continue;
                if (valueColumns.some(column => aiEvidenceContainsPlan(plan, header[column]))) return true;
            }
        }
        return false;
    }

    function aiUnitScale(value) {
        const unit = String(value || '').normalize('NFKC').toLowerCase();
        if (/^(?:b|billion|十亿|亿)$/.test(unit) || /\bb\s*(?:tokens?|credits?)|billion|十亿|亿/.test(unit)) return /亿/.test(unit) && !/十亿/.test(unit) ? 1e8 : 1e9;
        if (/^(?:m|million|百万)$/.test(unit) || /\bm\s*(?:tokens?|credits?)|million|百万/.test(unit)) return 1e6;
        if (/^(?:k|thousand|千)$/.test(unit) || /\bk\s*(?:tokens?|credits?)|thousand|千/.test(unit)) return 1e3;
        if (/^(?:万|ten[- ]?thousand)$/.test(unit) || /万|ten[- ]?thousand/.test(unit)) return 1e4;
        return 1;
    }

    function aiEvidenceQuantities(evidence) {
        const source = String(evidence || '').normalize('NFKC');
        const pattern = /(\d[\d,，]*(?:\.\d+)?)(?:\s*)(B|M|K|亿|万|billion|million|thousand|百万|十亿|千)?\s*(tokens?|credits?|points?|requests?|calls?|messages?|积分|点数|次|请求|调用)/giu;
        const matches = [];
        let match;
        while ((match = pattern.exec(source))) {
            const value = Number(String(match[1]).replace(/[,，]/g, ''));
            const kind = aiBaseUnitKind(match[3]);
            if (Number.isFinite(value) && kind !== 'unknown') {
                matches.push({ kind, value: value * aiUnitScale(match[2] || '') });
            }
        }
        return matches;
    }

    function aiWindowKey(value) {
        const text = String(value || '').normalize('NFKC').toLowerCase().replace(/[\s_-]+/g, '');
        if (/^(?:5h|5hours?|5小时|5小时内)$/.test(text)) return '5h';
        if (/weekly|每周|每7天|7天|7日|7days?|every7days?|一周/.test(text)) return 'weekly';
        if (/daily|每天|每日|每24小时|24h/.test(text)) return 'daily';
        if (/monthly|每月|每个月|月度|月付|每自然月/.test(text)) return 'monthly';
        return '';
    }

    function aiEvidenceWindows(evidence) {
        const source = String(evidence || '').normalize('NFKC').toLowerCase();
        const result = [];
        if (/(?:^|[^a-z0-9])5\s*(?:h|hours?)\b|5\s*小时|5h内/.test(source)) result.push('5h');
        if (/weekly|per\s*week|per\s*7\s*days?|every\s*7\s*days?|每周|每\s*7\s*天|7\s*天|7\s*日|一周/.test(source)) result.push('weekly');
        if (/daily|per\s*day|每天|每日|每\s*24\s*小时|24\s*h/.test(source)) result.push('daily');
        if (/monthly|per\s*month|每月|每个?月|月度|月付|每自然月/.test(source)) result.push('monthly');
        return [...new Set(result)];
    }

    function aiResolveWindow(item, evidence) {
        const declared = aiWindowKey(item?.window);
        const quoted = aiEvidenceWindows(evidence);
        if (declared && quoted.includes(declared)) return declared;
        if (!declared && quoted.length === 1) return quoted[0];
        return '';
    }

    function aiPriceCurrencyIsExplicit(currency, evidence) {
        const code = normalizeCurrencyCode(currency);
        const patterns = {
            CNY: /人民币|CNY|RMB|¥|￥|元/i,
            USD: /美元|USD|US\$/i,
            EUR: /EUR|欧元|€/i,
            GBP: /GBP|英镑|£/i,
            JPY: /JPY|日元|円/i,
            HKD: /HKD|港币|HK\$/i,
            KRW: /KRW|韩元|₩/i,
            SGD: /SGD|新币|S\$/i,
            AUD: /AUD|澳元|A\$/i,
            CAD: /CAD|加元|C\$/i,
            INR: /INR|印度卢比|₹/i
        };
        return Boolean(patterns[code] && patterns[code].test(String(evidence || '')));
    }

    function aiNumbersInText(text) {
        return [...String(text || '').normalize('NFKC').matchAll(/\d[\d,，]*(?:\.\d+)?/g)]
            .map(match => Number(String(match[0]).replace(/[,，]/g, '')))
            .filter(Number.isFinite);
    }

    function aiMetricValue(type, item) {
        if (type === 'price') return Number(item.amount);
        const parsed = type === 'quota'
            ? parseQuotaValue(item.value, item.unit)
            : parseQuotaValue(item.estimatedTokens, item.estimatedUnit);
        return Number.isFinite(parsed.value) ? parsed.value * aiUnitScale(parsed.unit) : NaN;
    }

    function aiDataConflictKeys(data) {
        const conflicted = new Set();
        const groups = new Map();
        const add = (type, item) => {
            const metric = aiMetricValue(type, item);
            if (!Number.isFinite(metric)) return;
            const groupKey = type === 'quota'
                ? [type, normalizePlanKey(item.plan), aiBaseUnitKind(item.unit), aiWindowKey(item.window) || String(item.window || '').toLowerCase()].join('|')
                : [type, normalizePlanKey(item.plan), normalizePlanKey(item.modelId || item.model), aiWindowKey(item.window) || String(item.window || '').toLowerCase()].join('|');
            if (!groups.has(groupKey)) groups.set(groupKey, []);
            groups.get(groupKey).push({ key: aiFieldKey(type, item), metric });
        };
        (Array.isArray(data?.quotas) ? data.quotas : []).forEach(item => add('quota', item));
        (Array.isArray(data?.modelEstimates) ? data.modelEstimates : []).forEach(item => add('estimate', item));
        groups.forEach(items => {
            const distinct = new Set(items.map(item => Number(item.metric.toPrecision(12))));
            if (distinct.size > 1) items.forEach(item => conflicted.add(item.key));
        });
        return conflicted;
    }

    function aiFieldIssue(snapshot, type, item, conflictedKeys) {
        const issues = [];
        const evidence = String(item.evidence || '').trim();
        const sourceText = String(snapshot?.evidenceText || snapshot?.excerpt || '');
        const key = aiFieldKey(type, item);
        if (!item.plan || item.plan === '未标注套餐') {
            issues.push('AI 未提供明确套餐名');
        } else if (evidence && !aiEvidenceContainsPlan(item.plan, evidence) && !aiSourceTableSupportsPlan(item.plan, evidence, sourceText, type, item)) {
            issues.push('引用片段未写套餐名，且抓取正文中无法确认对应表格列');
        }
        if (!evidence) {
            issues.push('AI 没有提供原文证据');
        } else {
            const quote = normalizeAiEvidenceText(evidence);
            const source = normalizeAiEvidenceText(sourceText);
            if (quote.length < 6 || !source.includes(quote)) issues.push('引用内容无法在本次抓取正文中核实');
        }
        if (type === 'price') {
            const amount = Number(item.amount);
            if (!Number.isFinite(amount) || amount < 0 || !aiEvidenceContainsValue(type, item, evidence)) {
                issues.push('原文证据中找不到对应价格数值');
            }
            if (!aiPriceCurrencyIsExplicit(item.currency, evidence)) issues.push('原文证据没有明确支持所标币种');
        } else {
            const parsed = type === 'quota'
                ? parseQuotaValue(item.value, item.unit)
                : parseQuotaValue(item.estimatedTokens, item.estimatedUnit);
            const unit = parsed.unit;
            const kind = aiBaseUnitKind(unit);
            const metric = Number.isFinite(parsed.value) ? parsed.value * aiUnitScale(unit) : NaN;
            if (!Number.isFinite(metric) || metric <= 0) issues.push('额度数值或单位无法安全解析');
            else if (kind === 'unknown') issues.push('额度单位不明确，无法分类');
            else if (!aiEvidenceContainsValue(type, item, evidence)) {
                issues.push('原文证据中找不到相同数量级的数值和单位');
            }
            const resolvedWindow = aiResolveWindow(item, evidence);
            if (!resolvedWindow || !Number.isFinite(monthlyMultiplier(resolvedWindow))) {
                issues.push('额度周期不明确，不能可靠折算');
            }
        }
        if (conflictedKeys?.has(key)) issues.push('同一套餐/模型/周期出现互相矛盾的数值');
        return [...new Set(issues)];
    }

    function getAiSnapshotReview(snapshot) {
        const sourceData = snapshot?.data && typeof snapshot.data === 'object' ? snapshot.data : {};
        const data = { ...sourceData, prices: [], quotas: [], modelEstimates: [] };
        const exceptions = [];
        const fieldDecisions = snapshot?.fieldDecisions && typeof snapshot.fieldDecisions === 'object' ? snapshot.fieldDecisions : {};
        const counts = { automatic: 0, accepted: 0, ignored: 0, pending: 0 };
        if (!snapshot?.data) return { data, exceptions, counts, unsupported: false };
        if (Number(snapshot.reviewPolicyVersion) !== 1) return { data, exceptions, counts, unsupported: true };

        const conflictedKeys = aiDataConflictKeys(sourceData);
        const process = (type, rows, destination) => {
            (Array.isArray(rows) ? rows : []).forEach(item => {
                const key = aiFieldKey(type, item);
                const decision = String(fieldDecisions[key] || '');
                const issues = aiFieldIssue(snapshot, type, item, conflictedKeys);
                const exception = { type, item, key, issues, decision };
                if (issues.length) exceptions.push(exception);
                if (issues.length && decision !== 'accepted') {
                    if (decision === 'ignored') counts.ignored += 1;
                    else counts.pending += 1;
                    return;
                }
                if (!issues.length && decision === 'ignored') {
                    counts.ignored += 1;
                    return;
                }
                const resolvedWindow = type === 'quota' || type === 'estimate' ? aiResolveWindow(item, item.evidence) : '';
                destination.push(resolvedWindow ? { ...item, window: resolvedWindow } : item);
                if (issues.length) counts.accepted += 1;
                else counts.automatic += 1;
            });
        };
        process('price', sourceData.prices, data.prices);
        process('quota', sourceData.quotas, data.quotas);
        process('estimate', sourceData.modelEstimates, data.modelEstimates);
        return { data, exceptions, counts, unsupported: false };
    }

    function setAiFieldDecision(url, fieldKey, action, fingerprint = '') {
        const snapshot = GM_getValue(aiSnapshotKey(url), null);
        if (!snapshot?.data) return false;
        if (String(snapshot.fingerprint || '') !== String(fingerprint || '')) return false;
        if (Number(snapshot.reviewPolicyVersion) !== 1) return false;
        const exception = getAiSnapshotReview(snapshot).exceptions.find(item => item.key === fieldKey);
        if (!exception) return false;
        const fieldDecisions = { ...(snapshot.fieldDecisions || {}) };
        if (action === 'accept') fieldDecisions[fieldKey] = 'accepted';
        else if (action === 'ignore') fieldDecisions[fieldKey] = 'ignored';
        else if (action === 'reopen') delete fieldDecisions[fieldKey];
        else return false;
        saveAiSnapshot(url, { ...snapshot, fieldDecisions });
        return true;
    }

    function tokenValueToB(value, kind) {
        const amount = Number(value);
        if (!Number.isFinite(amount) || amount < 0) return NaN;
        if (kind === 'b-tokens') return amount;
        if (kind === 'm-tokens') return amount / 1000;
        if (kind === 'k-tokens') return amount / 1000000;
        if (kind === 'wan-tokens') return amount / 100000;
        if (kind === 'tokens') return amount / 1000000000;
        return NaN;
    }

    function collectProviderAiData(provider) {
        const links = [
            ...getUsableLinks(provider, 'rules').map(link => ({ ...link, sourceKind: 'rules', sourcePriority: 0 })),
            ...getUsableLinks(provider, 'pricing').map(link => ({ ...link, sourceKind: 'pricing', sourcePriority: 1 })),
            ...getUsableLinks(provider, 'updates').map(link => ({ ...link, sourceKind: 'updates', sourcePriority: 2 }))
        ];
        return links
            .map(link => {
                const snapshot = GM_getValue(aiSnapshotKey(link.url), null);
                const review = getAiSnapshotReview(snapshot);
                const hasUsableData = review.data.quotas.length || review.data.modelEstimates.length;
                const data = review.unsupported || !hasUsableData ? null : review.data;
                return { link, snapshot, data, review, historical: false };
            })
            .filter(item => item.data)
            .sort((a, b) => String(b.snapshot.checkedAt || '').localeCompare(String(a.snapshot.checkedAt || '')));
    }

    function getAiPlanExceptionCounts(provider, plan) {
        const links = [...getUsableLinks(provider, 'rules'), ...getUsableLinks(provider, 'pricing'), ...getUsableLinks(provider, 'updates')];
        const counts = { pending: 0, accepted: 0 };
        links.forEach(link => {
            const snapshot = GM_getValue(aiSnapshotKey(link.url), null);
            getAiSnapshotReview(snapshot).exceptions.forEach(exception => {
                if (!['quota', 'estimate'].includes(exception.type) || !planMatches(plan, exception.item?.plan)) return;
                if (exception.decision === 'accepted') counts.accepted += 1;
                else if (exception.decision !== 'ignored') counts.pending += 1;
            });
        });
        return counts;
    }

    function deriveQuotaCapacity(row, provider) {
        const candidates = collectProviderAiData(provider);
        const exact = [];
        const modelEstimated = [];
        const requests = [];
        const relative = [];
        candidates.forEach(({ link, snapshot, data, historical }) => {
            const estimates = Array.isArray(data?.modelEstimates) ? data.modelEstimates : [];
            estimates.forEach(estimate => {
                if (!planMatches(row.plan, estimate.plan)) return;
                const parsed = parseQuotaValue(estimate.estimatedTokens, estimate.estimatedUnit);
                const value = parsed.value;
                const kind = quotaUnitKind(parsed.unit);
                const multiplier = monthlyMultiplier(estimate.window || 'monthly');
                const monthlyB = tokenValueToB(value, kind) * multiplier;
                if (!Number.isFinite(monthlyB)) return;
                modelEstimated.push({
                    model: estimate.model,
                    modelId: estimate.modelId,
                    monthlyB,
                    value,
                    unit: parsed.unit,
                    window: estimate.window,
                    basis: estimate.basis,
                    evidence: estimate.evidence,
                    sourceUrl: link.url,
                    sourceKind: link.sourceKind,
                    sourcePriority: Number(link.sourcePriority) || 0,
                    checkedAt: snapshot.checkedAt || '',
                    confidence: String(data?.confidence || 'low'),
                    historical
                });
            });
            const quotas = Array.isArray(data?.quotas) ? data.quotas : [];
            quotas.forEach(quota => {
                if (!planMatches(row.plan, quota.plan)) return;
                const parsedQuota = parseQuotaValue(quota.value, quota.unit);
                const value = parsedQuota.value;
                if (!Number.isFinite(value) || value < 0) return;
                const multiplier = monthlyMultiplier(quota.window);
                const kind = quotaUnitKind(parsedQuota.unit);
                const source = {
                    value,
                    unit: String(parsedQuota.unit || 'unknown'),
                    window: String(quota.window || 'unknown'),
                    evidence: String(quota.evidence || ''),
                    sourceUrl: link.url,
                    sourceKind: link.sourceKind,
                    sourcePriority: Number(link.sourcePriority) || 0,
                    checkedAt: snapshot.checkedAt || '',
                    confidence: String(data?.confidence || 'low'),
                    historical
                };
                if (kind.endsWith('tokens') && Number.isFinite(multiplier)) {
                    const monthlyB = tokenValueToB(value, kind) * multiplier;
                    if (Number.isFinite(monthlyB)) exact.push({ ...source, monthlyB });
                } else if (kind === 'requests' && Number.isFinite(multiplier)) {
                    const monthlyRequests = value * multiplier;
                    requests.push({ ...source, monthlyRequests });
                } else if (kind === 'credits') {
                    relative.push(source);
                }
            });
        });
        const confidenceRank = value => ({ high: 3, medium: 2, low: 1 }[String(value || '').toLowerCase()] || 0);
        const preferred = (left, right) => {
            if (Boolean(left.historical) !== Boolean(right.historical)) return left.historical ? 1 : -1;
            if (Number(left.sourcePriority) !== Number(right.sourcePriority)) return Number(left.sourcePriority) - Number(right.sourcePriority);
            if (confidenceRank(left.confidence) !== confidenceRank(right.confidence)) return confidenceRank(right.confidence) - confidenceRank(left.confidence);
            return String(right.checkedAt || '').localeCompare(String(left.checkedAt || ''));
        };
        const dedupeBy = (items, keyOf, metricKey = '') => {
            const best = new Map();
            items.forEach(item => {
                const key = keyOf(item);
                const current = best.get(key);
                if (!current) {
                    best.set(key, item);
                    return;
                }
                const currentMetric = metricKey ? Number(current[metricKey]) : NaN;
                const itemMetric = metricKey ? Number(item[metricKey]) : NaN;
                if (Number.isFinite(itemMetric) && Number.isFinite(currentMetric) && itemMetric !== currentMetric) {
                    if (itemMetric < currentMetric) best.set(key, item);
                    return;
                }
                if (preferred(item, current) < 0) best.set(key, item);
            });
            return [...best.values()];
        };
        const uniqueEstimates = dedupeBy(modelEstimated, item => normalizePlanKey(item.modelId || item.model) + '|' + String(item.window || ''), 'monthlyB');
        const uniqueQuotas = dedupeBy(exact, item => String(item.window || ''), 'monthlyB');
        const uniqueRequests = dedupeBy(requests, item => normalizePlanKey(item.unit) + '|' + String(item.window || ''), 'monthlyRequests');
        const uniqueRelative = dedupeBy(relative, item => normalizePlanKey(item.unit) + '|' + String(item.window || ''), 'value');
        // 同一套餐可能同时存在月度上限与滚动窗口上限，取折算后更严格的约束。
        uniqueQuotas.sort((a, b) => a.monthlyB - b.monthlyB);
        uniqueEstimates.sort((a, b) => a.monthlyB - b.monthlyB);
        uniqueRequests.sort((a, b) => a.monthlyRequests - b.monthlyRequests);
        if (uniqueQuotas.length) {
            const item = uniqueQuotas[0];
            return {
                kind: 'official-token',
                minB: item.monthlyB,
                baseB: item.monthlyB,
                maxB: item.monthlyB,
                confidence: item.confidence === 'high' ? 'high' : 'medium',
                label: '官方 Token 月容量 ' + item.monthlyB.toFixed(2) + 'B',
                evidence: (item.historical ? '沿用上次成功 AI 结果；' : '') + (item.evidence || (item.value + ' ' + item.unit + '/' + item.window)),
                sourceUrl: item.sourceUrl,
                checkedAt: item.checkedAt
            };
        }
        if (uniqueEstimates.length) {
            const item = uniqueEstimates[0];
            return {
                kind: 'model-estimated-token',
                minB: NaN,
                baseB: NaN,
                maxB: NaN,
                modelEstimates: uniqueEstimates.slice(0, 30),
                confidence: item.confidence === 'high' ? 'medium' : 'low',
                label: '按模型估算（' + uniqueEstimates.length + ' 个模型）',
                evidence: (item.historical ? '沿用上次成功 AI 结果；' : '') + (item.basis || item.evidence || '官方页面估算'),
                sourceUrl: item.sourceUrl,
                checkedAt: item.checkedAt
            };
        }
        const builtin = Number(row.capacityB);
        const hasBuiltin = row.capacityB !== null && row.capacityB !== '' && Number.isFinite(builtin) && builtin >= 0;
        if (hasBuiltin) {
            return {
                kind: row.capacityMode === 'official-token' ? 'official-token' : 'builtin-credit',
                minB: row.capacityMode === 'official-token' ? builtin : NaN,
                baseB: row.capacityMode === 'official-token' ? builtin : NaN,
                maxB: row.capacityMode === 'official-token' ? builtin : NaN,
                creditValue: row.capacityMode === 'official-token' ? NaN : builtin,
                creditUnit: row.capacityMode === 'official-token' ? '' : 'B Credits',
                creditWindow: row.capacityMode === 'official-token' ? '' : '月',
                confidence: row.capacityMode === 'official-token' ? 'high' : 'medium',
                label: row.capacityMode === 'official-token'
                    ? '内置 Token 月容量 ' + builtin.toFixed(2) + 'B'
                    : '内置 ' + builtin.toFixed(2) + 'B Credits/月',
                evidence: row.evidence,
                sourceUrl: '',
                checkedAt: ''
            };
        }
        if (uniqueRequests.length) {
            const item = uniqueRequests[0];
            return {
                kind: 'requests',
                minB: NaN,
                baseB: NaN,
                maxB: NaN,
                requestCountMonthly: item.monthlyRequests,
                requestUnit: item.unit,
                requestWindow: item.window,
                confidence: 'low',
                label: Math.round(item.monthlyRequests).toLocaleString() + ' 次/月（不折算 Token）',
                evidence: (item.historical ? '沿用上次成功 AI 结果；' : '') + (item.evidence || (item.value + ' ' + item.unit + '/' + item.window)),
                sourceUrl: item.sourceUrl,
                checkedAt: item.checkedAt
            };
        }
        if (uniqueRelative.length) {
            const item = uniqueRelative[0];
            return {
                kind: 'relative-credit',
                minB: NaN,
                baseB: NaN,
                maxB: NaN,
                creditValue: item.value,
                creditUnit: item.unit,
                creditWindow: item.window,
                confidence: 'relative',
                label: item.value.toLocaleString() + ' ' + item.unit + '/' + item.window + '（不折算 Token）',
                evidence: (item.historical ? '沿用上次成功 AI 结果；' : '') + item.evidence,
                sourceUrl: item.sourceUrl,
                checkedAt: item.checkedAt
            };
        }
        const requestMatch = String(row.bottleneck || '').match(/([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:次|请求|messages?)\s*\/\s*(月|周|7\s*天|天)/i);
        if (requestMatch) {
            const value = Number(requestMatch[1].replace(/,/g, ''));
            const multiplier = monthlyMultiplier(requestMatch[2]);
            const monthlyRequests = value * multiplier;
            return {
                kind: 'requests',
                minB: NaN,
                baseB: NaN,
                maxB: NaN,
                requestCountMonthly: monthlyRequests,
                requestUnit: '次',
                requestWindow: requestMatch[2],
                confidence: 'low',
                label: '官方额度 ' + Math.round(monthlyRequests).toLocaleString() + ' 次/月（不折算 Token）',
                evidence: row.bottleneck,
                sourceUrl: '',
                checkedAt: ''
            };
        }
        const relativeMatch = String(row.bottleneck || '').match(/([0-9][0-9,]*(?:\.[0-9]+)?)\s*(Credits?|积分|点数)\s*\/\s*(月|周|7\s*天|天)/i);
        if (relativeMatch) {
            return {
                kind: 'relative-credit',
                minB: NaN,
                baseB: NaN,
                maxB: NaN,
                creditValue: Number(relativeMatch[1].replace(/,/g, '')),
                creditUnit: relativeMatch[2],
                creditWindow: relativeMatch[3],
                confidence: 'relative',
                label: Number(relativeMatch[1].replace(/,/g, '')).toLocaleString() + ' ' + relativeMatch[2] + '/' + relativeMatch[3] + '（不折算 Token）',
                evidence: row.bottleneck,
                sourceUrl: '',
                checkedAt: ''
            };
        }
        return {
            kind: 'unavailable',
            minB: NaN,
            baseB: NaN,
            maxB: NaN,
            confidence: 'unknown',
            label: '尚无可折算 Token 数据',
            evidence: row.evidence || row.bottleneck,
            sourceUrl: '',
            checkedAt: ''
        };
    }

    function buildCapacityProfiles(rows, providers) {
        const result = new Map();
        rows.forEach(row => {
            const provider = providers.get(row.providerId) || { id: row.providerId, links: {} };
            result.set(row.id, deriveQuotaCapacity(row, provider));
        });
        return result;
    }

    function formatCny(value) {
        const amount = Number(value);
        return Number.isFinite(amount) ? '¥' + amount.toFixed(2) : '待定';
    }

    function readCalcCart() {
        const saved = GM_getValue(CALC_CART_KEY, {});
        const source = saved && typeof saved === 'object' ? saved : {};
        return {
            targetB: Number.isFinite(Number(source.targetB)) && Number(source.targetB) > 0 ? Number(source.targetB) : 20,
            nightPercent: Number.isFinite(Number(source.nightPercent)) ? Math.min(100, Math.max(0, Number(source.nightPercent))) : 40,
            apiMode: String(source.apiMode || API_COST_PROFILES[0].id),
            customApiCost: Number.isFinite(Number(source.customApiCost)) ? Math.max(0, Number(source.customApiCost)) : 0,
            quantities: source.quantities && typeof source.quantities === 'object' ? source.quantities : {},
            // 兼容旧版本已保存的数据；购物车不再展示或写入覆盖值。
            overrides: source.overrides && typeof source.overrides === 'object' ? source.overrides : {}
        };
    }

    function saveCalcCart(cart) {
        GM_setValue(CALC_CART_KEY, {
            targetB: Number(cart.targetB) > 0 ? Number(cart.targetB) : 20,
            nightPercent: Math.min(100, Math.max(0, Number(cart.nightPercent) || 0)),
            apiMode: String(cart.apiMode || API_COST_PROFILES[0].id),
            customApiCost: Math.max(0, Number(cart.customApiCost) || 0),
            quantities: cart.quantities && typeof cart.quantities === 'object' ? cart.quantities : {}
        });
    }

    function getCartRows() {
        const enabledIds = new Set(getEnabledProviders().map(provider => provider.id));
        return CART_ACCOUNT_ROWS.filter(row => enabledIds.has(row.providerId));
    }

    function getAccountPrice(row, rates) {
        const baseAmount = row.price === null || row.price === undefined || row.price === '' ? NaN : Number(row.price);
        const currency = normalizeCurrencyCode(row.currency);
        return {
            amount: Number.isFinite(baseAmount) && baseAmount >= 0 ? baseAmount : NaN,
            currency,
            cny: convertToCny(baseAmount, currency, rates)
        };
    }

    function getAccountCapacity(row) {
        const baseCapacity = row.capacityB === null || row.capacityB === undefined || row.capacityB === '' ? NaN : Number(row.capacityB);
        return Number.isFinite(baseCapacity) && baseCapacity >= 0 ? baseCapacity : NaN;
    }

    function calculateApiCostPerB(mode, nightPercent, customCost) {
        if (mode === 'custom') return Math.max(0, Number(customCost) || 0);
        const profile = API_COST_PROFILES.find(item => item.id === mode) || API_COST_PROFILES[0];
        const nightDiscount = 1 - Math.min(100, Math.max(0, Number(nightPercent) || 0)) / 100 * 0.5;
        const cacheHitShare = Math.min(1, Math.max(0, Number(profile.cacheHitShare ?? 0.8)));
        const inputCostPerM = Number(profile.inputCache || 0) * cacheHitShare + Number(profile.inputMiss || 0) * (1 - cacheHitShare);
        const outputCostPerM = Number(profile.output || 0) * Number(profile.outputShare || 0.1);
        return Math.max(0, (inputCostPerM + outputCostPerM) * nightDiscount * 1000);
    }

    function formatProbeDetails(probe, url) {
        if (!probe) return '<div class="llm-muted" data-source-details>尚未取得正文。点击“检查”开始。</div>';
        const displayProbe = getProbeDisplay(probe);
        const retained = Boolean(probe.currentProbe || probe.attemptFailed);
        const facts = displayProbe.extractFacts || {};
        const formatPriceFacts = sourceFacts => Array.isArray(sourceFacts?.prices) ? sourceFacts.prices.slice(0, 5).map(item => {
            const cny = Number(item.amountCny);
            const displayAmount = Number(item.amountDisplay);
            const displayCode = normalizeCurrencyCode(sourceFacts.displayCurrency || 'CNY');
            return escapeHtml(item.raw || (currencySymbol(item.currency) + item.amount))
                + (Number.isFinite(displayAmount) ? '≈' + escapeHtml(currencySymbol(displayCode) + displayAmount.toFixed(2)) : (Number.isFinite(cny) ? '≈' + escapeHtml(formatCny(cny)) : '（未换算）'));
        }).join('、') : '';
        const priceFacts = formatPriceFacts(facts);
        const previousPriceFacts = retained ? formatPriceFacts(probe.extractFacts || {}) : '';
        const ai = formatAiProbeDetail(displayProbe, url || probe.sourceUrl || '');
        const partial = retained || displayProbe.weak || displayProbe.uncomparable;
        const factsText = [
            facts.confidence ? '确定性抽取 ' + facts.confidence : '',
            facts.inferredCurrency && facts.inferredCurrency !== 'UNKNOWN' ? '页面推断币种 ' + facts.inferredCurrency : '页面币种未明确',
            priceFacts ? (partial ? '本次片段规则识别价格（可能不完整） ' : '本地规则识别价格（仅金额线索，可能漏项） ') + priceFacts : ''
        ].filter(Boolean).join('；');
        const probeError = displayProbe.error
            || (!displayProbe.ok ? (displayProbe.attemptError || displayProbe.lastError || '') : '');
        const textLength = Number(displayProbe.textLength || 0);
        const rendered = displayProbe.uncomparable
            ? '页面可访问，但未取得可比较正文'
            : probeError
                ? ((displayProbe.rendered ? '动态渲染异常：' : 'HTTP正文异常：') + probeError)
                : textLength === 0
                    ? (displayProbe.rendered ? '动态渲染未取得正文' : 'HTTP响应正文为空')
                    : displayProbe.weak
                        ? (displayProbe.rendered ? '动态渲染正文已保存，但正文过短或不完整' : 'HTTP 正文已保存，但正文过短或不完整')
                    : (displayProbe.rendered ? '动态渲染正文已保存' : 'HTTP 正文已保存');
        const currentText = '本次正文 ' + textLength.toLocaleString() + ' 字';
        const completeness = displayProbe.completeness && typeof displayProbe.completeness === 'object'
            ? (displayProbe.completeness.complete
                ? '正文完整性校验通过（' + String(displayProbe.completeness.profile || '通用页面') + '）'
                : '正文完整性校验未通过：' + String(displayProbe.completeness.reason || displayProbe.aiBlockReason || '正文不完整'))
            : '正文完整性尚未评估；请重新抓取';
        const retainedText = retained
            ? '<br><span style="color:#e3b341;">本次抓取与历史记录已分开：本次结果未把历史价格当成本次抓取结果；' + (previousPriceFacts ? '下方“上次成功记录价格”不是本次抓取结果。' : '本次未取得可用于完整判断的正文。') + '</span>'
            : '';
        const previousText = previousPriceFacts
            ? '<br><span style="color:#8b949e;">上次成功记录价格（' + escapeHtml(formatDate(probe.checkedAt)) + '）：' + previousPriceFacts + '</span>'
            : '';
        return '<div class="llm-muted" data-source-details>' + escapeHtml(rendered) + '；' + escapeHtml(currentText) + '；' + escapeHtml(completeness) + '；' + escapeHtml(factsText || '本次正文未识别结构化价格')
            + (ai ? '；' + ai : '')
            + retainedText
            + previousText
            + '<br><span style="word-break:break-all;">证据来源：' + escapeHtml(url || probe.sourceUrl || '') + '</span></div>';
    }

    captureRenderedSourceIfRequested();
    if (/(?:^|[&#])llm-codeplans-probe=[a-f0-9]{8}/i.test(String(location.hash || ''))) return;

    // ======================== 3. 样式隔离 (Scoped CSS) ========================
    const STYLES = `
        #llm-floater, #llm-modal {
            --llm-bg: rgba(22, 27, 34, 0.92);
            --llm-card: rgba(33, 38, 45, 0.82);
            --llm-border: rgba(240, 246, 252, 0.14);
            --llm-primary: #3b82f6;
            --llm-text: #f0f6fc;
            --llm-text-dim: #8b949e;
            --llm-green: #238636;
            --llm-amber: #d29922;
            --llm-red: #f85149;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: var(--llm-text);
        }
        #llm-floater *, #llm-modal * { box-sizing: border-box; }
        #llm-floater {
            position: fixed; width: 48px; height: 48px; border-radius: 50%;
            background: linear-gradient(135deg, #1f6feb, #238636);
            box-shadow: 0 8px 24px rgba(0,0,0,0.45);
            display: flex; align-items: center; justify-content: center;
            color: #ffffff; cursor: grab; z-index: 999998;
            user-select: none; touch-action: none;
            transition: box-shadow 0.2s ease, transform 0.22s ease, opacity 0.22s ease;
        }
        #llm-floater.llm-docked-left { left: 0 !important; right: auto !important; }
        #llm-floater.llm-docked-right { left: calc(100vw - 48px) !important; right: auto !important; }
        #llm-floater.llm-docked-left.llm-edge-hidden { transform: translateX(-30px); opacity: 0.72; }
        #llm-floater.llm-docked-right.llm-edge-hidden { transform: translateX(30px); opacity: 0.72; }
        #llm-floater.llm-edge-hidden:hover,
        #llm-floater.llm-edge-hidden:focus-visible { transform: translateX(0); opacity: 1; }
        #llm-floater:active { cursor: grabbing; transform: scale(0.96); }
        #llm-floater svg { width: 24px; height: 24px; pointer-events: none; }
        #llm-modal {
            position: fixed; top: 80px; right: 25px;
            width: 860px; max-width: calc(100vw - 30px);
            height: 660px; max-height: calc(100vh - 80px);
            background: var(--llm-bg); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
            border: 1px solid var(--llm-border); border-radius: 16px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.6);
            z-index: 999999; display: none; flex-direction: column; overflow: hidden;
        }
        #llm-modal .llm-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 12px 18px; background: rgba(255, 255, 255, 0.04);
            border-bottom: 1px solid var(--llm-border); cursor: move;
        }
        #llm-modal .llm-title { font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        #llm-modal .llm-badge-version {
            font-size: 11px; padding: 2px 6px; background: rgba(56, 139, 253, 0.15);
            color: #58a6ff; border-radius: 12px; border: 1px solid rgba(56, 139, 253, 0.3);
        }
        #llm-modal .llm-actions { display: flex; gap: 8px; }
        #llm-modal .llm-btn-icon {
            background: transparent; border: none; color: var(--llm-text-dim);
            cursor: pointer; padding: 4px; border-radius: 6px; font-size: 14px; transition: all 0.15s;
        }
        #llm-modal .llm-btn-icon:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
        #llm-modal .llm-tabs {
            display: flex; background: rgba(0, 0, 0, 0.25);
            padding: 4px 14px; gap: 6px; border-bottom: 1px solid var(--llm-border);
        }
        #llm-modal .llm-tab {
            padding: 6px 12px; font-size: 13px; cursor: pointer; border-radius: 6px;
            color: var(--llm-text-dim); transition: all 0.2s; user-select: none;
        }
        #llm-modal .llm-tab:hover { color: #fff; background: rgba(255, 255, 255, 0.05); }
        #llm-modal .llm-tab.active { color: #fff; background: var(--llm-primary); font-weight: 500; }
        #llm-modal .llm-body { flex: 1; overflow-y: auto; padding: 16px; }
        #llm-modal .llm-body::-webkit-scrollbar { width: 6px; }
        #llm-modal .llm-body::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 3px; }
        #llm-modal .llm-card {
            background: var(--llm-card); border: 1px solid var(--llm-border);
            border-radius: 10px; padding: 12px 14px; margin-bottom: 10px;
        }
        #llm-modal .llm-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        #llm-modal .llm-provider-name { font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
        #llm-modal .llm-provider-tag {
            font-size: 10px; padding: 1px 5px; border-radius: 4px;
            background: rgba(35, 134, 54, 0.2); color: #3fb950; border: 1px solid rgba(35, 134, 54, 0.3);
        }
        #llm-modal .llm-grid-details { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 12px; margin-bottom: 6px; color: #c9d1d9; }
        #llm-modal .llm-highlight-promo {
            background: rgba(210, 153, 34, 0.12); border-left: 3px solid var(--llm-amber);
            padding: 6px 10px; border-radius: 0 6px 6px 0; font-size: 12px; color: #e3b341; margin-bottom: 6px;
        }
        #llm-modal .llm-card-links { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
        #llm-modal .llm-link-chip {
            font-size: 11px; color: #58a6ff; background: rgba(56, 139, 253, 0.12);
            padding: 3px 8px; border-radius: 6px; text-decoration: none; transition: all 0.15s;
        }
        #llm-modal .llm-link-chip:hover { background: var(--llm-primary); color: #fff; }
        #llm-modal .llm-calc-box {
            background: var(--llm-card); border: 1px solid var(--llm-border);
            border-radius: 12px; padding: 16px; margin-bottom: 14px;
        }
        #llm-modal .llm-input-group {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 10px; font-size: 13px;
        }
        #llm-modal .llm-input-num {
            background: rgba(0, 0, 0, 0.4); border: 1px solid var(--llm-border);
            color: #fff; padding: 6px 10px; border-radius: 6px; width: 110px; text-align: center;
        }
        #llm-modal .llm-rank-item {
            display: flex; justify-content: space-between; padding: 10px 14px;
            background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 6px; font-size: 13px;
        }
        #llm-modal .llm-btn {
            border: 1px solid var(--llm-border); background: rgba(56,139,253,0.14);
            color: #dbeafe; cursor: pointer; padding: 6px 12px; border-radius: 6px; font-size: 12px;
        }
        #llm-modal .llm-btn:hover { background: var(--llm-primary); color: #fff; }
        #llm-modal .llm-btn:disabled { opacity: 0.5; cursor: wait; }
        #llm-modal .llm-settings-row {
            background: var(--llm-card); border: 1px solid var(--llm-border);
            border-radius: 10px; padding: 12px 14px; margin-bottom: 10px;
        }
        #llm-modal .llm-settings-row textarea {
            width: 100%; min-height: 54px; box-sizing: border-box; resize: vertical; margin-top: 5px;
            background: rgba(0,0,0,0.35); border: 1px solid var(--llm-border); color: #fff; border-radius: 6px;
            padding: 7px 9px; font: 12px/1.5 ui-monospace, monospace;
        }
        #llm-modal .llm-settings-row input[type="text"],
        #llm-modal .llm-settings-row input[type="password"],
        #llm-modal .llm-settings-row input[type="number"],
        #llm-modal .llm-settings-row select {
            max-width: 100%; background: rgba(0,0,0,0.35); border: 1px solid var(--llm-border);
            color: #fff; border-radius: 6px; padding: 6px 8px; font-size: 12px;
        }
        #llm-modal .llm-settings-row input[type="text"],
        #llm-modal .llm-settings-row input[type="password"] { width: 100%; }
        #llm-modal .llm-settings-label { display: block; margin-top: 8px; color: var(--llm-text-dim); font-size: 11px; }
        #llm-modal .llm-source-status { font-size: 11px; margin-top: 5px; line-height: 1.4; }
        #llm-modal .llm-muted { color: var(--llm-text-dim); font-size: 11px; line-height: 1.5; }
        #llm-modal .llm-ai-exception-panel {
            margin: 9px 0 4px; padding: 9px 11px; border-radius: 8px;
            background: rgba(210,153,34,.12); color: var(--llm-text); font-size: 11px; line-height: 1.55;
        }
        #llm-modal .llm-ai-exception-panel > summary { cursor: pointer; color: #f0c75e; font-weight: 600; }
        #llm-modal .llm-ai-exception-list { display: grid; gap: 7px; margin-top: 8px; }
        #llm-modal .llm-ai-exception-item { padding: 8px 9px; border-radius: 7px; background: rgba(0,0,0,.15); }
        #llm-modal .llm-ai-exception-item-head { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 5px; color: var(--llm-text); }
        #llm-modal .llm-ai-exception-reason { margin-top: 3px; color: #f0c75e; }
        #llm-modal .llm-ai-exception-evidence { margin-top: 3px; color: var(--llm-text-dim); overflow-wrap: anywhere; }
        #llm-modal .llm-ai-exception-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
        #llm-modal .llm-ai-exception-actions .llm-btn { padding: 4px 8px; font-size: 11px; }
        #llm-modal .llm-ai-field-primary { border-color: #d29922; background: rgba(210,153,34,.24); color: #fff; }
        #llm-modal .llm-ai-exception-accepted { color: #f0c75e; }
        #llm-modal .llm-ai-exception-ignored { color: var(--llm-text-dim); }
        #llm-modal .llm-ai-exception-pending { color: #f0c75e; }
        #llm-modal .llm-ai-calc-warning { color: #f0c75e; }
        #llm-modal .llm-ai-diagnostics-panel {
            display: grid; gap: 5px; margin-top: 8px; padding: 9px 11px; border-radius: 8px;
            background: rgba(248,81,73,.08); color: #ffb4ad; overflow-wrap: anywhere;
        }
        #llm-modal .llm-ai-diagnostics-heading { color: #ff8b82; font-weight: 600; }
        #llm-modal .llm-ai-diagnostics-panel .llm-btn { justify-self: start; padding: 4px 8px; font-size: 11px; }
        #llm-modal .llm-calc-hero {
            display: flex; justify-content: space-between; align-items: flex-start; gap: 14px;
            background: linear-gradient(135deg, rgba(56,139,253,.18), rgba(35,134,54,.12));
            border: 1px solid rgba(88,166,255,.28); border-radius: 14px; padding: 16px; margin-bottom: 12px;
        }
        #llm-modal .llm-calc-kicker { color: #79c0ff; font-size: 11px; margin-bottom: 4px; }
        #llm-modal .llm-calc-hero h2 { margin: 0; font-size: 18px; }
        #llm-modal .llm-calc-hero p { margin: 7px 0 0; color: var(--llm-text-dim); font-size: 12px; line-height: 1.6; }
        #llm-modal .llm-calc-overview {
            display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-bottom: 10px;
        }
        #llm-modal .llm-summary-card {
            min-width: 0; background: var(--llm-card); border: 1px solid var(--llm-border);
            border-radius: 10px; padding: 11px 12px;
        }
        #llm-modal .llm-summary-card span { display: block; color: var(--llm-text-dim); font-size: 11px; }
        #llm-modal .llm-summary-card strong { display: block; margin: 5px 0 3px; font-size: 16px; overflow-wrap: anywhere; }
        #llm-modal .llm-summary-card small { color: var(--llm-text-dim); font-size: 10px; }
        #llm-modal .llm-summary-token { border-color: rgba(63,185,80,.4); }
        #llm-modal .llm-summary-request { border-color: rgba(88,166,255,.4); }
        #llm-modal .llm-summary-other { border-color: rgba(210,153,34,.4); }
        #llm-modal .llm-summary-foot { grid-column: 1 / -1; color: var(--llm-text-dim); font-size: 11px; padding: 2px 3px; }
        #llm-modal .llm-plan-legend { display: flex; flex-wrap: wrap; gap: 7px 14px; color: var(--llm-text-dim); font-size: 11px; margin: 5px 2px 12px; }
        #llm-modal .llm-plan-section { margin: 0 0 14px; }
        #llm-modal .llm-plan-section-head {
            display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;
            padding: 10px 12px; border-radius: 10px 10px 0 0; background: rgba(255,255,255,.045);
            border: 1px solid var(--llm-border); border-bottom: 0;
        }
        #llm-modal .llm-plan-section-head h3 { margin: 0; font-size: 14px; }
        #llm-modal .llm-plan-section-head p { margin: 4px 0 0; color: var(--llm-text-dim); font-size: 11px; line-height: 1.5; }
        #llm-modal .llm-plan-section-head > span { color: var(--llm-text-dim); font-size: 11px; white-space: nowrap; }
        #llm-modal .llm-plan-card {
            background: color-mix(in srgb, var(--provider-color, #58a6ff) 5%, var(--llm-card)); border: 1px solid var(--llm-border); border-top: 0;
            padding: 12px; margin: 0;
        }
        #llm-modal .llm-provider-card { border-top: 2px solid var(--provider-color, #58a6ff); }
        #llm-modal .llm-provider-source-card { background: var(--llm-card); }
        #llm-modal .llm-plan-card:last-child { border-radius: 0 0 10px 10px; }
        #llm-modal .llm-plan-card-head { display: flex; justify-content: space-between; gap: 10px; align-items: center; }
        #llm-modal .llm-plan-title { display: flex; align-items: center; gap: 7px; min-width: 0; font-size: 13px; font-weight: 600; }
        #llm-modal .llm-plan-title span { overflow-wrap: anywhere; }
        #llm-modal .llm-provider-dot { display: none; }
        #llm-modal .llm-plan-badge { display: inline-block; padding: 2px 6px; border-radius: 5px; font-size: 10px; line-height: 1.2; color: color-mix(in srgb, var(--provider-color, #58a6ff) 75%, #fff); background: color-mix(in srgb, var(--provider-color, #58a6ff) 14%, #202832); border: 1px solid color-mix(in srgb, var(--provider-color, #58a6ff) 35%, transparent); white-space: nowrap; }
        #llm-modal .llm-provider-label { color: var(--provider-color, #58a6ff); }
        #llm-modal .llm-plan-price { color: #dbeafe; font-size: 12px; text-align: right; white-space: nowrap; }
        #llm-modal .llm-plan-metrics { display: grid; grid-template-columns: 1fr 1fr 130px; gap: 8px; margin-top: 10px; }
        #llm-modal .llm-plan-metrics > div { background: rgba(0,0,0,.16); border-radius: 7px; padding: 7px 8px; min-width: 0; }
        #llm-modal .llm-plan-metrics span { display: block; color: var(--llm-text-dim); font-size: 10px; }
        #llm-modal .llm-plan-metrics strong { display: block; margin-top: 3px; font-size: 12px; overflow-wrap: anywhere; }
        #llm-modal .llm-plan-metrics input { width: 58px; margin-top: 3px; padding: 4px 5px; }
        #llm-modal .llm-plan-metrics em { color: var(--llm-text-dim); font-style: normal; font-size: 11px; margin-left: 3px; }
        #llm-modal .llm-plan-note { color: #c9d1d9; font-size: 11px; margin-top: 9px; line-height: 1.5; }
        #llm-modal .llm-plan-evidence { color: var(--llm-text-dim); font-size: 10px; line-height: 1.5; margin-top: 3px; }
        #llm-modal .llm-model-estimate-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; margin-top: 8px; }
        #llm-modal .llm-model-estimate-list > div { background: rgba(0,0,0,.14); border: 1px solid rgba(255,255,255,.07); border-radius: 7px; padding: 7px 8px; min-width: 0; }
        #llm-modal .llm-model-estimate-list span { display: block; color: var(--llm-text-dim); font-size: 10px; overflow-wrap: anywhere; }
        #llm-modal .llm-model-estimate-list strong { display: block; margin-top: 3px; font-size: 11px; }
        #llm-modal .llm-model-estimate-list em { display: block; margin-top: 2px; color: var(--llm-text-dim); font-size: 9px; font-style: normal; }
        #llm-modal .llm-empty-state { color: var(--llm-text-dim); border: 1px solid var(--llm-border); border-radius: 0 0 10px 10px; padding: 12px; font-size: 11px; }
        @media (max-width: 700px) {
            #llm-modal .llm-calc-overview { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            #llm-modal .llm-plan-metrics { grid-template-columns: 1fr 1fr; }
            #llm-modal .llm-plan-metrics > div:last-child { grid-column: 1 / -1; }
            #llm-modal .llm-model-estimate-list { grid-template-columns: 1fr; }
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.innerHTML = STYLES;
    document.head.appendChild(styleEl);

    // ======================== 4. DOM 节点构建 ========================
    const floater = document.createElement('div');
    floater.id = 'llm-floater';
    floater.title = '长按可拖动，点击展开比价雷达';
    floater.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"></path><path d="m9 12 2 2 4-4"></path></svg>`;
    document.body.appendChild(floater);

    const FLOATER_EDGE_GAP = 18;
    let floaterDockSide = '';

    function setFloaterDock(side, hidden = true) {
        floaterDockSide = side === 'left' || side === 'right' ? side : '';
        floater.classList.toggle('llm-docked-left', floaterDockSide === 'left');
        floater.classList.toggle('llm-docked-right', floaterDockSide === 'right');
        floater.classList.toggle('llm-edge-hidden', Boolean(floaterDockSide && hidden));
    }

    function dockFloater(left, top, persist = true) {
        const maxTop = Math.max(FLOATER_EDGE_GAP, window.innerHeight - floater.offsetHeight - FLOATER_EDGE_GAP);
        const clampedTop = Math.max(FLOATER_EDGE_GAP, Math.min(maxTop, Number(top) || FLOATER_EDGE_GAP));
        const side = Number(left) + floater.offsetWidth / 2 < window.innerWidth / 2 ? 'left' : 'right';
        floater.style.right = 'auto';
        floater.style.bottom = 'auto';
        floater.style.top = clampedTop + 'px';
        floater.style.left = side === 'left' ? '0px' : Math.max(0, window.innerWidth - floater.offsetWidth) + 'px';
        setFloaterDock(side, true);
        if (persist) GM_setValue('llm_floater_pos', { left: side === 'left' ? 0 : window.innerWidth - floater.offsetWidth, top: clampedTop, dock: side });
    }

    const savedPos = GM_getValue('llm_floater_pos', null);
    if (savedPos && typeof savedPos.left === 'number' && typeof savedPos.top === 'number') {
        const clampX = Math.max(10, Math.min(window.innerWidth - 58, savedPos.left));
        const clampY = Math.max(10, Math.min(window.innerHeight - 58, savedPos.top));
        floater.style.left = `${clampX}px`;
        floater.style.top = `${clampY}px`;
    } else {
        floater.style.right = '24px';
        floater.style.bottom = '75px';
    }

    if (savedPos && (savedPos.dock === 'left' || savedPos.dock === 'right')) {
        dockFloater(savedPos.left, savedPos.top, false);
    }

    const modal = document.createElement('div');
    modal.id = 'llm-modal';
    modal.innerHTML = `
        <div class="llm-header" id="llm-header-drag">
            <div class="llm-title">
                <span>🤖 LLM CodePlans Pro</span>
                <span class="llm-badge-version">v${APP_VERSION}</span>
            </div>
            <div class="llm-actions">
                <button type="button" class="llm-btn-icon" id="llm-btn-close" title="关闭" aria-label="关闭窗口">✕</button>
            </div>
        </div>
        <div class="llm-tabs">
            <div class="llm-tab active" data-target="matrix">📊 套餐比价矩阵</div>
            <div class="llm-tab" data-target="radar">📢 动态更新雷达</div>
            <div class="llm-tab" data-target="calc">🧮 月用量成本测算</div>
            <div class="llm-tab" data-target="settings">⚙️ 厂商配置</div>
        </div>
        <div class="llm-body" id="llm-body-content"></div>
    `;
    document.body.appendChild(modal);

    const bodyContent = modal.querySelector('#llm-body-content');

    // ======================== 5. 视图逻辑 ========================
    function renderMatrix() {
        const providers = getEnabledProviders();
        let html = `
            <div style="margin-bottom: 10px;">
                <input type="text" id="llm-search-input" placeholder="🔍 过滤厂商或模型 (如 Qwen, DeepSeek, 智谱)..." style="
                    background: rgba(0,0,0,0.3); border: 1px solid var(--llm-border); color: #fff; padding: 7px 12px; border-radius: 8px; width: 100%; font-size: 12px; outline: none;
                " />
            </div>
            <div class="llm-muted" style="margin-bottom: 10px;">当前已启用 ${providers.length} 家厂商。可点击下方链接直达官网定价与更新页。</div>
            <div id="llm-cards-list">
        `;
        providers.forEach(p => {
            const pricingLinks = getUsableLinks(p, 'pricing');
            const rulesLinks = getUsableLinks(p, 'rules');
            const updateLinks = getUsableLinks(p, 'updates');
            const kw = [p.name, p.models, p.category, p.tag, p.plans, p.promos, p.traps].join(' ');
            const aiSnapshot = getProviderAiSnapshot(p);
            const aiSnapshotText = formatProviderAiStatus(aiSnapshot);
            html += `
                <div class="llm-card llm-provider-card" data-provider-id="${escapeHtml(p.id)}" data-kw="${escapeHtml(kw)}" style="--provider-color:${providerColor(p.id)};">
                    <div class="llm-card-header">
                        <div class="llm-provider-name">
                            <span>${escapeHtml(p.name)}</span>
                            <span class="llm-provider-tag">${escapeHtml(p.tag)}</span>
                            <span style="font-size: 11px; color: var(--llm-text-dim);">(${escapeHtml(p.category)})</span>
                        </div>
                        <div style="font-weight: 600; color: var(--provider-color); font-size: 13px; text-align: right; max-width: 55%;">${escapeHtml(p.plans)}</div>
                    </div>
                    <div class="llm-grid-details">
                        <div><strong>📦 额度规则：</strong>${escapeHtml(p.quotaDesc)}</div>
                        <div><strong>🧠 主力模型：</strong>${escapeHtml(p.models)}</div>
                    </div>
                    <div class="llm-highlight-promo">🎁 <strong>活动优惠：</strong>${escapeHtml(p.promos)}</div>
                    <div style="font-size: 11px; color: var(--llm-red); margin-bottom: 6px;">⚠️ <strong>避坑提示：</strong>${escapeHtml(p.traps)}</div>
                    <div class="llm-muted">官方数据核验：${escapeHtml(p.verifiedAt)}</div>
                    ${aiSnapshotText ? '<div class="llm-highlight-promo">🤖 ' + escapeHtml(aiSnapshotText) + '</div>' : ''}
                    <div class="llm-card-links">
                        ${pricingLinks.map(l => `<a href="${safeHref(l.url)}" target="_blank" rel="noopener noreferrer" class="llm-link-chip">💳 ${escapeHtml(l.title)}</a>`).join('')}
                        ${rulesLinks.map(l => `<a href="${safeHref(l.url)}" target="_blank" rel="noopener noreferrer" class="llm-link-chip" style="background: rgba(210,153,34,0.18); color: #e3b341;">📐 ${escapeHtml(l.title)}</a>`).join('')}
                        ${updateLinks.map(l => `<a href="${safeHref(l.url)}" target="_blank" rel="noopener noreferrer" class="llm-link-chip" style="background: rgba(35,134,54,0.18); color: #3fb950;">📢 ${escapeHtml(l.title)}</a>`).join('')}
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        bodyContent.innerHTML = html;

        const search = bodyContent.querySelector('#llm-search-input');
        search.addEventListener('input', (e) => {
            const v = e.target.value.toLowerCase();
            bodyContent.querySelectorAll('.llm-card').forEach(c => {
                c.style.display = c.getAttribute('data-kw').toLowerCase().includes(v) ? 'block' : 'none';
            });
        });
    }

    function renderRadar() {
        const providers = getEnabledProviders();
        let html = `
            <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
                <button class="llm-btn" id="llm-probe-all" title="依次联网抓取全部启用的定价与更新来源，不自动调用 AI">① 全量抓取检查</button>
                <button class="llm-btn" id="llm-probe-pricing" title="只联网抓取定价与额度/扣费规则来源，不检查更新公告，也不自动调用 AI">② 仅抓取定价/规则</button>
                <button class="llm-btn" id="llm-radar-refresh" title="只重新渲染本地已保存状态，不发起网络请求">③ 刷新本地状态</button>
            </div>
            <div class="llm-card" style="margin-bottom: 12px;">
                <div style="font-size: 12px; line-height: 1.7;">
                    <strong>雷达操作说明</strong><br>
                    ① <strong>全量抓取检查</strong>：逐个抓取所有定价和更新来源；适合完整巡检，速度较慢，不自动调用 AI。<br>
                    ② <strong>仅抓取定价/规则</strong>：只抓取价格/套餐和额度/扣费规则来源；适合优先核对成本与额度，不自动调用 AI。<br>
                    ③ <strong>刷新本地状态</strong>：不联网，只重新显示已保存结果。每条来源的“抓取检查”默认只采集；打开配置中的自动开关后，仅在首次取得完整正文或正文发生变化时自动调用 AI；“AI重新抓取分析”会重新取正文并先做完整性校验，不需要先点“抓取检查”。未通过校验时不会发送 AI 请求。<br>
                    <span class="llm-muted">AI 数据会逐条核验证据：正常字段自动采用；证据、套餐、单位或周期对不上时，只拦下异常字段并在来源卡片说明原因。确认“仍采用”或“忽略本次”后，同一正文版本不重复提醒。抓取或 AI 调用失败时仍显示脱敏诊断并可复制，不会包含 API Key、请求正文或完整响应。AI 数据不会直接覆盖厂商配置里的基础资料。</span>
                </div>
            </div>
        `;
        providers.forEach(p => {
            [...getUsableLinks(p, 'pricing').map(l => ({ ...l, kind: 'pricing' })), ...getUsableLinks(p, 'rules').map(l => ({ ...l, kind: 'rules' })), ...getUsableLinks(p, 'updates').map(l => ({ ...l, kind: 'updates' }))].forEach(up => {
                const key = `llm_view_${p.id}_${encodeURIComponent(up.title)}`;
                const last = GM_getValue(key, '未读');
                const lastProbe = GM_getValue(sourceKey(up.url), null);
                const summary = probeSummary(lastProbe);
                const aiReviewState = getAiReviewState(lastProbe);
                const aiButtonLabel = aiReviewState.kind === 'action' ? '建议运行 AI分析' : 'AI重新抓取分析';
                const aiButtonStyle = aiReviewState.kind === 'action' || aiReviewState.kind === 'attention' ? ' style="border-color:#d29922;"' : '';
                html += `
                    <div class="llm-settings-row llm-provider-source-card" data-source-card="${escapeHtml(up.url)}" style="--provider-color:${providerColor(p.id)};">
                        <div style="display: flex; justify-content: space-between; gap: 10px; align-items: flex-start;">
                            <div style="min-width: 0;">
                                <div style="font-size: 13px;"><strong style="color: var(--provider-color);">[${escapeHtml(p.name)}]</strong> <span class="llm-muted">${up.kind === 'pricing' ? '定价' : (up.kind === 'rules' ? '规则' : '更新')}</span> ${escapeHtml(up.title)}</div>
                                <div style="font-size: 11px; color: var(--llm-text-dim); margin-top: 3px;">上次打开：${escapeHtml(last)}</div>
                                <div class="llm-source-status" data-source-status style="color: ${summary.color};">来源检查：${escapeHtml(summary.label)}</div>
                                <div class="llm-source-status" data-ai-review-state style="color: ${aiReviewState.color};">${escapeHtml(aiReviewState.label)}</div>
                            </div>
                            <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end;">
                                <button class="llm-btn llm-probe-one" data-url="${safeHref(up.url)}" data-kind="${up.kind}" title="抓取页面正文并比较历史指纹；默认不调用 AI，自动开关开启后按条件调用">抓取检查</button>
                                <button class="llm-btn llm-ai-one" data-url="${safeHref(up.url)}" data-kind="${up.kind}" title="${escapeHtml(aiReviewState.label)}；点击后会重新抓取正文"${aiButtonStyle}>${aiButtonLabel}</button>
                                <a href="${safeHref(up.url)}" target="_blank" rel="noopener noreferrer" class="llm-link-chip track-read" data-key="${escapeHtml(key)}" style="font-size: 12px; padding: 5px 10px;">打开官方来源 ↗</a>
                            </div>
                        </div>
                        ${formatProbeDetails(lastProbe, up.url)}
                    </div>
                `;
            });
        });
        bodyContent.innerHTML = html;

        if (!bodyContent.dataset.aiDiagnosticCopyBound) {
            bodyContent.dataset.aiDiagnosticCopyBound = '1';
            bodyContent.addEventListener('click', event => {
                const fieldButton = event.target.closest('.llm-ai-field-action');
                if (fieldButton && bodyContent.contains(fieldButton)) {
                    event.preventDefault();
                    const url = fieldButton.getAttribute('data-ai-field-url') || '';
                    const key = fieldButton.getAttribute('data-ai-field-key') || '';
                    const action = fieldButton.getAttribute('data-ai-field-action') || '';
                    const fingerprint = fieldButton.getAttribute('data-ai-field-fingerprint') || '';
                    fieldButton.disabled = true;
                    if (setAiFieldDecision(url, key, action, fingerprint)) {
                        renderRadar();
                    } else {
                        fieldButton.disabled = false;
                        fieldButton.textContent = '页面已更新，请重新检查';
                    }
                    return;
                }
                const button = event.target.closest('.llm-copy-ai-diagnostics');
                if (!button || !bodyContent.contains(button)) return;
                const text = button.getAttribute('data-ai-diagnostics') || '';
                if (!text) return;
                GM_setClipboard(text, 'text');
                const original = button.textContent;
                button.textContent = '已复制';
                setTimeout(() => {
                    if (button.isConnected) button.textContent = original;
                }, 1200);
            });
        }

        bodyContent.querySelectorAll('.track-read').forEach(el => {
            el.addEventListener('click', () => {
                GM_setValue(el.getAttribute('data-key'), new Date().toLocaleDateString());
            });
        });

        const checkOne = async (button, forceAi = false, skipAutoAi = false) => {
            const url = button.getAttribute('data-url');
            const card = button.closest('[data-source-card]');
            const status = card?.querySelector('[data-source-status]');
            const aiReviewStatus = card?.querySelector('[data-ai-review-state]');
            const details = card?.querySelector('[data-source-details]');
            const actionName = forceAi ? 'AI重新分析' : '抓取检查';
            button.disabled = true;
            if (status) { status.textContent = '来源检查：' + actionName + '中…'; status.style.color = '#e3b341'; }
            try {
                const result = await probeSource(url, {
                    forceAi,
                    forceFresh: forceAi,
                    skipAutoAi
                });
                const next = probeSummary(result);
                const nextAiReviewState = getAiReviewState(result);
                if (status) { status.textContent = '来源检查：' + next.label; status.style.color = next.color; }
                if (aiReviewStatus) { aiReviewStatus.textContent = nextAiReviewState.label; aiReviewStatus.style.color = nextAiReviewState.color; }
                applyAiReviewButtonState(card?.querySelector('.llm-ai-one'), result);
                if (details) details.outerHTML = formatProbeDetails(result, url);
            } catch (error) {
                const message = error && error.message ? error.message : String(error || '未知错误');
                if (status) { status.textContent = actionName + '失败：' + message; status.style.color = '#f85149'; }
            } finally {
                button.disabled = false;
            }
        };

        bodyContent.querySelectorAll('.llm-probe-one').forEach(btn => {
            btn.addEventListener('click', () => checkOne(btn));
        });

        bodyContent.querySelectorAll('.llm-ai-one').forEach(btn => {
            btn.addEventListener('click', () => checkOne(btn, true));
        });

        const sleep = ms => new Promise(r => setTimeout(r, ms));
        const runBatch = async (button, selector) => {
            button.disabled = true;
            try {
                for (const btn of bodyContent.querySelectorAll(selector)) {
                    await checkOne(btn, false, true);
                    await sleep(350);
                }
            } finally {
                button.disabled = false;
            }
        };

        bodyContent.querySelector('#llm-probe-all').addEventListener('click', e => {
            runBatch(e.currentTarget, '.llm-probe-one');
        });

        bodyContent.querySelector('#llm-probe-pricing').addEventListener('click', e => {
            runBatch(e.currentTarget, '.llm-probe-one[data-kind="pricing"], .llm-probe-one[data-kind="rules"]');
        });

        bodyContent.querySelector('#llm-radar-refresh').addEventListener('click', renderRadar);
    }

    // ======================== 6. 分类测算 + 自选购物车 ========================
    function renderCalc() {
        const settings = readAppSettings();
        const rates = parseFxRates(settings.currency.rates);
        const cart = readCalcCart();
        const rows = getCartRows();
        const providers = new Map(getAllProviders().map(provider => [provider.id, provider]));
        const capacityProfiles = buildCapacityProfiles(rows, providers);
        rows.forEach(row => {
            const capacity = capacityProfiles.get(row.id);
            if (capacity) capacity.aiExceptionCounts = getAiPlanExceptionCounts(providers.get(row.providerId), row.plan);
        });

        const categoryOf = (row, capacity) => {
            const price = getAccountPrice(row, rates);
            if (!Number.isFinite(price.cny)) return 'incomplete';
            if (capacity?.kind === 'official-token') return 'token';
            if (capacity?.kind === 'model-estimated-token') return 'model-estimated';
            if (capacity?.kind === 'requests') return 'requests';
            if (capacity?.kind === 'relative-credit' || capacity?.kind === 'builtin-credit') return 'credits';
            return 'incomplete';
        };
        const categoryMeta = {
            token: { title: 'Token 方案', subtitle: '有明确 Token 月容量，才进入 Token 总量和单位成本计算。', icon: '🟩' },
            'model-estimated': { title: '按模型估算 Token', subtitle: '同一套餐按不同模型分别估算；这些数值不相加，也不是固定保证额度。', icon: '🟪' },
            requests: { title: '请求次数方案', subtitle: '只比较价格和请求次数；不把一次请求擅自换算成 Token。', icon: '🟦' },
            credits: { title: 'Credits / 积分方案', subtitle: '保留厂商自己的额度单位；没有官方换算规则就不折算 Token。', icon: '🟨' },
            incomplete: { title: '信息不完整', subtitle: '套餐仍然保留，但缺少可靠价格、额度或抓取结果，不参与性价比计算。', icon: '⬜' }
        };
        const formatDefaultPrice = row => {
            const price = getAccountPrice(row, rates);
            if (!Number.isFinite(price.cny)) return '价格未知';
            return currencySymbol(price.currency) + Number(price.amount).toFixed(2) + ' ≈ ¥' + price.cny.toFixed(2) + '/月';
        };
        const formatCapacity = capacity => {
            if (capacity?.kind === 'official-token' && Number.isFinite(capacity.baseB)) return capacity.baseB.toFixed(2) + 'B Token/月';
            if (capacity?.kind === 'model-estimated-token') return '按模型分别估算（不合并）';
            if (capacity?.kind === 'requests' && Number.isFinite(capacity.requestCountMonthly)) return Math.round(capacity.requestCountMonthly).toLocaleString() + ' 次/月';
            if ((capacity?.kind === 'relative-credit' || capacity?.kind === 'builtin-credit') && capacity.label) return capacity.label;
            return '暂无可靠额度';
        };
        const formatUnitCost = (row, capacity) => {
            const price = getAccountPrice(row, rates);
            if (!Number.isFinite(price.cny)) return '价格未知';
            if (capacity?.kind === 'official-token' && Number(capacity.baseB) > 0) return '¥' + (price.cny / capacity.baseB).toFixed(2) + '/B Token';
            if (capacity?.kind === 'model-estimated-token') return '按模型查看';
            if (capacity?.kind === 'requests' && Number(capacity.requestCountMonthly) > 0) return '¥' + (price.cny / capacity.requestCountMonthly * 1000).toFixed(2) + '/千次';
            return '不计算单位成本';
        };
        const rowHtml = (row, capacity, category) => {
            const provider = providers.get(row.providerId) || { name: row.providerId };
            const tone = planTone(row.plan);
            const quantity = Math.floor(Math.max(0, Number(cart.quantities[row.id]) || 0));
            const price = getAccountPrice(row, rates);
            const priceText = formatDefaultPrice(row);
            const capacityText = formatCapacity(capacity);
            const unitCostText = formatUnitCost(row, capacity);
            const sourceText = capacity?.evidence || row.evidence || row.bottleneck || '暂无来源说明';
            const missingText = !Number.isFinite(price.cny) && category === 'incomplete'
                ? '价格未取得；'
                : !Number.isFinite(price.cny) ? '价格未知；' : '';
            return [
                '<div class="llm-plan-card" data-cart-row="' + escapeHtml(row.id) + '" style="--provider-color:' + escapeHtml(providerColor(row.providerId)) + ';--plan-tone:' + tone + '">',
                '<div class="llm-plan-card-head">',
                '<label class="llm-plan-title"><input type="checkbox" data-cart-check ' + (quantity > 0 ? 'checked' : '') + ' /> <span class="llm-provider-label">' + escapeHtml(provider.name) + '</span><span class="llm-plan-badge">' + escapeHtml(row.plan) + '</span></label>',
                '<span class="llm-plan-price">' + escapeHtml(priceText) + '</span>',
                '</div>',
                '<div class="llm-plan-metrics">',
                '<div><span>单账号额度</span><strong>' + escapeHtml(capacityText) + '</strong></div>',
                '<div><span>单位成本</span><strong>' + escapeHtml(unitCostText) + '</strong></div>',
                '<div><span>购买数量</span><input class="llm-input-num" type="number" min="0" step="1" data-cart-quantity value="' + quantity + '" /><em>个</em></div>',
                '</div>',
                capacity?.kind === 'model-estimated-token'
                    ? '<div class="llm-model-estimate-list">' + capacity.modelEstimates.map(item => '<div><span>' + escapeHtml(item.model) + (item.modelId ? ' · ' + escapeHtml(item.modelId) : '') + '</span><strong>' + escapeHtml(Number(item.monthlyB).toFixed(4)) + 'B Token/月</strong><em>' + (Number.isFinite(price.cny) && Number(item.monthlyB) > 0 ? '约 ¥' + (price.cny / item.monthlyB).toFixed(2) + '/B；' : '') + escapeHtml(item.basis || '页面估算') + '</em></div>').join('') + '</div>'
                    : '',
                '<div class="llm-plan-note">' + escapeHtml(missingText + (capacity?.label || row.bottleneck || '暂无额度说明')) + '</div>',
                capacity?.aiExceptionCounts?.pending ? '<div class="llm-plan-note llm-ai-calc-warning">有 ' + capacity.aiExceptionCounts.pending + ' 项 AI 额度证据异常，异常值未自动纳入；其他可核验数据和现有可靠数据仍照常测算。详情见动态更新雷达。</div>' : '',
                capacity?.aiExceptionCounts?.accepted ? '<div class="llm-plan-note llm-ai-calc-warning">有 ' + capacity.aiExceptionCounts.accepted + ' 项 AI 额度异常按你的选择采用，请留意对应来源证据。</div>' : '',
                '<div class="llm-plan-evidence">依据：' + escapeHtml(sourceText) + (capacity?.checkedAt ? '；更新于 ' + escapeHtml(formatDate(capacity.checkedAt)) : '') + '</div>',
                '</div>'
            ].join('');
        };
        const sectionHtml = (category, rowsInCategory) => {
            const meta = categoryMeta[category];
            const cards = rowsInCategory.map(row => rowHtml(row, capacityProfiles.get(row.id), category)).join('');
            return [
                '<section class="llm-plan-section llm-plan-section-' + category + '">',
                '<div class="llm-plan-section-head"><div><h3>' + meta.icon + ' ' + meta.title + '</h3><p>' + meta.subtitle + '</p></div><span>' + rowsInCategory.length + ' 个方案</span></div>',
                cards || '<div class="llm-empty-state">当前没有符合条件的方案。</div>',
                '</section>'
            ].join('');
        };
        const grouped = { token: [], 'model-estimated': [], requests: [], credits: [], incomplete: [] };
        rows.forEach(row => grouped[categoryOf(row, capacityProfiles.get(row.id))].push(row));

        bodyContent.innerHTML = [
            '<div class="llm-calc-hero">',
            '<div><div class="llm-calc-kicker">🧮 订阅方案测算</div><h2>单账号能力 + 自选购物车</h2><p>这里只做两件事：勾选要买的套餐，再填写买几个。Token、请求次数、Credits/积分分开统计，不互相硬换算。</p></div>',
            '<button class="llm-btn" id="llm-clear-cart">清空购物车</button>',
            '</div>',
            '<div id="llm-calc-summary" class="llm-calc-overview"></div>',
                '<div class="llm-plan-legend"><span>🟩 固定 Token</span><span>🟪 按模型估算 Token</span><span>🟦 请求次数</span><span>🟨 Credits/积分</span><span>⬜ 信息不完整</span></div>',
            '<div class="llm-plan-sections">',
            sectionHtml('token', grouped.token),
            sectionHtml('model-estimated', grouped['model-estimated']),
            sectionHtml('requests', grouped.requests),
            sectionHtml('credits', grouped.credits),
            sectionHtml('incomplete', grouped.incomplete),
            '</div>'
        ].join('');

        const readDomCart = () => {
            const next = readCalcCart();
            next.quantities = {};
            bodyContent.querySelectorAll('[data-cart-row]').forEach(rowEl => {
                const id = rowEl.getAttribute('data-cart-row');
                const quantity = Math.floor(Math.max(0, Number(rowEl.querySelector('[data-cart-quantity]').value) || 0));
                next.quantities[id] = rowEl.querySelector('[data-cart-check]').checked ? quantity : 0;
            });
            saveCalcCart(next);
            return next;
        };
        const recalculate = () => {
            const current = readDomCart();
            const totals = {
                accounts: 0,
                monthlyCost: 0,
                unknownPriceAccounts: 0,
                tokenB: 0,
                tokenCost: 0,
                tokenUnknownPrice: 0,
                requestCount: 0,
                requestCost: 0,
                requestUnknownPrice: 0,
                modelEstimatedPlans: 0,
                creditPlans: 0,
                incompletePlans: 0
            };
            rows.forEach(row => {
                const quantity = Math.floor(Math.max(0, Number(current.quantities[row.id]) || 0));
                if (!quantity) return;
                const capacity = capacityProfiles.get(row.id);
                const price = getAccountPrice(row, rates);
                const category = categoryOf(row, capacity);
                totals.accounts += quantity;
                if (Number.isFinite(price.cny)) totals.monthlyCost += price.cny * quantity;
                else totals.unknownPriceAccounts += quantity;
                if (category === 'token' && Number.isFinite(capacity.baseB)) {
                    totals.tokenB += capacity.baseB * quantity;
                    if (Number.isFinite(price.cny)) totals.tokenCost += price.cny * quantity;
                    else totals.tokenUnknownPrice += quantity;
                } else if (category === 'requests' && Number.isFinite(capacity.requestCountMonthly)) {
                    totals.requestCount += capacity.requestCountMonthly * quantity;
                    if (Number.isFinite(price.cny)) totals.requestCost += price.cny * quantity;
                    else totals.requestUnknownPrice += quantity;
                } else if (category === 'model-estimated') totals.modelEstimatedPlans += quantity;
                else if (category === 'credits') totals.creditPlans += quantity;
                else if (category === 'incomplete') totals.incompletePlans += quantity;
            });
            const tokenCostText = totals.tokenB > 0 && totals.tokenUnknownPrice === 0 ? '¥' + (totals.tokenCost / totals.tokenB).toFixed(2) + '/B' : '待定';
            const requestCostText = totals.requestCount > 0 && totals.requestUnknownPrice === 0 ? '¥' + (totals.requestCost / totals.requestCount * 1000).toFixed(2) + '/千次' : '待定';
            document.getElementById('llm-calc-summary').innerHTML = [
                '<div class="llm-summary-card"><span>已选账号</span><strong>' + totals.accounts + ' 个</strong><small>只统计你勾选并填写数量的方案</small></div>',
                '<div class="llm-summary-card llm-summary-token"><span>Token 方案</span><strong>' + totals.tokenB.toFixed(2) + 'B</strong><small>单位成本：' + tokenCostText + '</small></div>',
                '<div class="llm-summary-card llm-summary-request"><span>请求次数方案</span><strong>' + Math.round(totals.requestCount).toLocaleString() + ' 次/月</strong><small>单位成本：' + requestCostText + '</small></div>',
                '<div class="llm-summary-card llm-summary-other"><span>按模型估算 / Credits / 不完整</span><strong>' + totals.modelEstimatedPlans + ' / ' + totals.creditPlans + ' / ' + totals.incompletePlans + ' 个</strong><small>估算值不合并 Token 总量</small></div>',
                '<div class="llm-summary-foot">已选方案月费：' + (totals.unknownPriceAccounts ? '部分价格未知，暂无法闭合' : formatCny(totals.monthlyCost)) + '。不同计量单位不会混加。</div>'
            ].join('');
        };

        bodyContent.querySelectorAll('[data-cart-quantity]').forEach(input => {
            input.addEventListener('input', recalculate);
            input.addEventListener('change', recalculate);
        });
        bodyContent.querySelectorAll('[data-cart-check]').forEach(check => {
            check.addEventListener('change', () => {
                const quantity = check.closest('[data-cart-row]')?.querySelector('[data-cart-quantity]');
                if (!quantity) return;
                if (check.checked && Number(quantity.value) <= 0) quantity.value = '1';
                if (!check.checked) quantity.value = '0';
                recalculate();
            });
        });
        bodyContent.querySelector('#llm-clear-cart').addEventListener('click', () => {
            const current = readCalcCart();
            saveCalcCart({ ...current, quantities: {} });
            renderCalc();
        });
        recalculate();
    }

    function renderSettings() {
        const providers = getAllProviders();
        const app = readAppSettings();
        const displayCurrencies = ['CNY', 'USD', 'EUR', 'GBP', 'JPY', 'HKD', 'KRW', 'SGD', 'CAD', 'AUD'];
        const currencyOptions = displayCurrencies.map(code => '<option value="' + code + '"' + (normalizeCurrencyCode(app.currency.display) === code ? ' selected' : '') + '>' + code + '</option>').join('');
        let html = [
            '<div class="llm-card">',
            '<div style="font-size:13px;font-weight:600;margin-bottom:6px;">使用说明</div>',
            '<div class="llm-muted" style="line-height:1.7;">这里的“厂商启用”控制矩阵、雷达和购物车是否显示该厂商；下面的地址是本地覆盖项，改成新的官方定价/公告 URL 后保存即可。AI 只在你打开开关并填写 Key 后工作，AI 输出必须人工确认，不会自动改写主数据。</div>',
            '</div>',
            '<div class="llm-settings-row">',
            '<div style="font-size:13px;font-weight:600;">AI 页面抽取（可选）</div>',
            '<div class="llm-muted" style="margin-top:4px;line-height:1.6;">用于动态页面、正文结构变化或普通抽取不完整时的辅助整理。Endpoint 需兼容 OpenAI Chat Completions；Key 只写入当前浏览器的 Tampermonkey 本地存储，不会写入脚本或 Git。普通“抓取检查”只有勾选下面的自动开关才会按条件调用 AI；顶部批量按钮永远只抓取，不调用 AI。</div>',
            '<label class="llm-settings-label"><input type="checkbox" data-ai-enabled ' + (app.ai.enabled ? 'checked' : '') + ' /> 启用 AI 抽取</label>',
            '<label class="llm-settings-label">Endpoint</label><input type="text" data-ai-endpoint value="' + escapeHtml(app.ai.endpoint) + '" />',
            '<label class="llm-settings-label">模型名</label><input type="text" data-ai-model value="' + escapeHtml(app.ai.model) + '" />',
            '<label class="llm-settings-label">API Key（本地保存）</label><input type="password" data-ai-key value="' + escapeHtml(app.ai.apiKey) + '" autocomplete="off" />',
            '<label class="llm-settings-label"><input type="checkbox" data-ai-first-check ' + (app.ai.runOnFirstCheck ? 'checked' : '') + ' /> 普通“抓取检查”在首次取得完整正文或完整正文发生变化时自动调用 AI（会产生 API 费用）</label>',
            '<label class="llm-settings-label">AI 证据包最大字符数</label><input type="number" data-ai-max-evidence-chars min="4000" max="' + MAX_AI_EVIDENCE_CHARS + '" step="500" value="' + Number(app.ai.maxEvidenceChars || 9000) + '" />',
            '<div class="llm-muted" style="margin-top:4px;line-height:1.6;">发送前会自动过滤重复导航、无关说明并优先保留价格、额度、扣费规则和“模型 × 套餐 × Token”证据。这里限制的是压缩后的证据包，不是原始网页大小。</div>',
            '<label class="llm-settings-label">正式 AI 复核超时（秒）</label><input type="number" data-ai-timeout min="30" max="300" step="10" value="' + Math.min(300, Math.max(30, Number(app.ai.timeoutSeconds) || 120)) + '" />',
            '<label class="llm-settings-label">AI 接口短消息测试超时（秒）</label><input type="number" data-ai-test-timeout min="30" max="300" step="10" value="' + Math.min(300, Math.max(30, Number(app.ai.testTimeoutSeconds) || 120)) + '" />',
            '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px;">',
            '<button type="button" class="llm-btn" id="llm-test-ai">测试 AI 接口</button>',
            '<span class="llm-muted">先检查连接、Key 和模型列表，再发送一个最多 128 tokens 的“OK”短请求；短消息测试超时与正式复核分开设置。若浏览器先超时取消，CPA 可能记录 HTTP 499/context canceled。</span>',
            '</div>',
            '<div id="llm-ai-test-result" class="llm-muted" style="margin-top:8px;line-height:1.7;"></div>',
            '</div>',
            '<div class="llm-settings-row">',
            '<div style="font-size:13px;font-weight:600;">币种与汇率</div>',
            '<div class="llm-muted" style="margin-top:4px;line-height:1.6;">金额保留来源原币种；下方汇率仅用于换算人民币。格式为“外币代码=人民币金额”，例如 USD=7.20。国外页面没有明确币种时显示待确认，不会根据 IP 猜测。</div>',
            '<label class="llm-settings-label">来源显示币种（购物车测算统一用 CNY）</label><select data-currency-display>' + currencyOptions + '</select>',
            '<label class="llm-settings-label">汇率（1 外币 = 多少 CNY）</label><textarea data-currency-rates>' + escapeHtml(app.currency.rates) + '</textarea>',
            '</div>',
            '<div class="llm-card">',
            '<div style="font-size:13px;font-weight:600;margin-bottom:6px;">配置与数据保存位置</div>',
            '<div class="llm-muted" style="line-height:1.7;">配置通过 Tampermonkey 的 GM_setValue/GM_getValue 保存于当前浏览器、当前用户的油猴脚本存储中；不会写入此脚本文件、网页 localStorage、Git 或项目目录。主要配置包括 AI/汇率（<code>llm_app_settings_v1</code>）、厂商开关和来源地址（<code>llm_provider_settings_v2</code>）、购物车（<code>llm_calc_cart_v1</code>）。抓取正文和 AI 结果也保存在同一位置，用于下次比较。API Key 虽不写入仓库，但这里不是独立密码保险箱；清理 Tampermonkey 数据、卸载脚本或更换浏览器后可能丢失。恢复初始默认只清除配置和购物车，不代表清除所有历史抓取缓存。</div>',
            '</div>',
            '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">',
            '<button class="llm-btn" id="llm-save-settings">保存全部配置</button>',
            '<button class="llm-btn" id="llm-reset-settings">恢复初始默认</button>',
            '</div>',
            '<div class="llm-muted" style="margin-bottom:8px;">厂商开关与来源地址</div>'
        ].join('');
        providers.forEach(provider => {
            const pricing = getUsableLinks(provider, 'pricing');
            const rules = getUsableLinks(provider, 'rules');
            const updates = getUsableLinks(provider, 'updates');
            html += [
                '<div class="llm-settings-row" data-provider-settings="' + escapeHtml(provider.id) + '">',
                '<label style="font-size:13px;font-weight:600;"><input type="checkbox" data-provider-enabled ' + (provider.enabled ? 'checked' : '') + ' /> ' + escapeHtml(provider.name) + ' <span class="llm-muted">(' + escapeHtml(provider.category) + ')</span></label>',
                '<label class="llm-settings-label">定价/套餐地址（每行：标题 | URL）</label>',
                '<textarea data-links="pricing">' + escapeHtml(pricing.map(link => link.title + ' | ' + link.url).join('\n')) + '</textarea>',
                '<label class="llm-settings-label">额度/扣费规则地址（每行：标题 | URL）</label>',
                '<div class="llm-muted">用于积分扣费、模型倍率、缓存价格或按模型 Token 预估等规则；不是让你手工填写公式。</div>',
                '<textarea data-links="rules">' + escapeHtml(rules.map(link => link.title + ' | ' + link.url).join('\n')) + '</textarea>',
                '<label class="llm-settings-label">更新/公告地址（每行：标题 | URL）</label>',
                '<textarea data-links="updates">' + escapeHtml(updates.map(link => link.title + ' | ' + link.url).join('\n')) + '</textarea>',
                '</div>'
            ].join('');
        });
        bodyContent.innerHTML = html;

        bodyContent.querySelector('#llm-test-ai').addEventListener('click', async event => {
            const button = event.currentTarget;
            const resultBox = bodyContent.querySelector('#llm-ai-test-result');
            const endpoint = bodyContent.querySelector('[data-ai-endpoint]').value.trim();
            const model = bodyContent.querySelector('[data-ai-model]').value.trim();
            const apiKey = bodyContent.querySelector('[data-ai-key]').value.trim();
            button.disabled = true;
            button.textContent = '测试中…';
            resultBox.innerHTML = '<span style="color:#e3b341;">正在检查模型列表与认证…</span>';
            try {
                const testTimeoutSeconds = Math.min(300, Math.max(30, Number(bodyContent.querySelector('[data-ai-test-timeout]').value) || 120));
                const result = await testAiConnection({ endpoint, model, apiKey, testTimeoutSeconds });
                if (result.validationError) {
                    resultBox.innerHTML = '<span style="color:#f85149;">测试未执行：' + escapeHtml(result.validationError) + '</span>';
                    return;
                }
                const lines = [];
                const models = result.models;
                if (models) {
                    const modelsDiagnostic = formatAiDiagnostics(models.diagnostics);
                    if (models.ok) {
                        lines.push('<span style="color:#3fb950;">① 网关连接与认证成功</span>：' + escapeHtml(modelsDiagnostic));
                        if (models.targetListed === true) {
                            lines.push('<span style="color:#3fb950;">模型列表中存在 ' + escapeHtml(model) + '</span>');
                        } else if (models.targetListed === false) {
                            lines.push('<span style="color:#e3b341;">模型列表中未找到 ' + escapeHtml(model) + '</span>；请核对模型名。');
                        } else if (models.parseWarning) {
                            lines.push('<span style="color:#e3b341;">' + escapeHtml(models.parseWarning) + '</span>');
                        } else {
                            lines.push('<span style="color:#e3b341;">模型列表为空，无法确认模型名；继续进行短消息测试。</span>');
                        }
                    } else {
                        const advice = explainAiDiagnostics(models.diagnostics);
                        lines.push('<span style="color:#f85149;">① 模型列表检查失败：' + escapeHtml(models.error || '未知错误') + '</span>');
                        lines.push('诊断：' + escapeHtml(modelsDiagnostic));
                        if (advice) lines.push('初步判断：' + escapeHtml(advice));
                    }
                }
                const chat = result.chat;
                if (chat) {
                    const chatDiagnostic = formatAiDiagnostics(chat.diagnostics);
                    if (chat.partial && chat.routeOk) {
                        const reasoningSummary = sanitizeAiDiagnosticText(chat.reasoning, 160);
                        lines.push('<span style="color:#f85149;">② 短消息测试失败：请求已到达模型，但没有最终文本</span>：' + escapeHtml(chat.error || '仅有推理内容') + '；' + escapeHtml(chatDiagnostic));
                        if (reasoningSummary) lines.push('推理内容摘要：' + escapeHtml(reasoningSummary));
                        lines.push('<strong style="color:#e3b341;">结论：Endpoint、API Key 和模型路由已连通，但接口没有返回脚本可用的最终文本；请检查响应格式、代理兼容性和模型输出设置。</strong>');
                    } else if (chat.ok) {
                        lines.push('<span style="color:#3fb950;">② 短消息测试成功</span>：模型返回“' + escapeHtml(sanitizeAiDiagnosticText(chat.content, 80)) + '”；' + escapeHtml(chatDiagnostic));
                        lines.push('<strong style="color:#3fb950;">结论：Endpoint、API Key、模型路由和返回格式均可用，短消息测试通过。该结果只验证基础调用链路；正式复核能否完成还取决于正文长度、模型处理速度、输出规模和当前超时设置。</strong>');
                    } else {
                        const advice = explainAiDiagnostics(chat.diagnostics);
                        lines.push('<span style="color:#f85149;">② 短消息测试失败：' + escapeHtml(chat.error || '未知错误') + '</span>');
                        lines.push('诊断：' + escapeHtml(chatDiagnostic));
                        if (chat.status === 499 || /context canceled|client closed request/i.test(String(chat.error || ''))) {
                            lines.push('<strong style="color:#e3b341;">判断：CPA/反向代理返回了 HTTP 499，表示上游请求被取消。若诊断耗时接近浏览器端测试超时，通常是浏览器先取消；若明显早于测试超时，则重点检查 CPA 的上游超时、模型路由和代理日志。</strong>');
                        }
                        if (advice) lines.push('初步判断：' + escapeHtml(advice));
                        if (chat.status === 0 && /超时/.test(String(chat.diagnostics?.phase || ''))) {
                            const gatewayConclusion = models?.ok
                                ? '网关连接和认证正常，但极短请求仍超时'
                                : '模型列表检查未成功，且极短请求也超时';
                            lines.push('<strong style="color:#f85149;">结论：' + gatewayConclusion + '；重点检查 ' + escapeHtml(model) + ' 的上游路由、账号状态、网络可达性和代理日志。</strong>');
                        } else {
                            lines.push('<strong style="color:#f85149;">结论：接口未通过完整短请求测试，请按上面的 HTTP 状态和错误摘要处理。</strong>');
                        }
                    }
                } else if (result.stoppedAfterModels) {
                    lines.push('<strong style="color:#f85149;">结论：认证或权限检查失败，未继续发送模型请求。</strong>');
                }
                resultBox.innerHTML = lines.join('<br>');
            } catch (error) {
                resultBox.innerHTML = '<span style="color:#f85149;">测试脚本异常：' + escapeHtml(error?.message || String(error || '未知错误')) + '</span>';
            } finally {
                button.disabled = false;
                button.textContent = '测试 AI 接口';
            }
        });

        bodyContent.querySelector('#llm-save-settings').addEventListener('click', () => {
            const providerSettings = readProviderSettings();
            bodyContent.querySelectorAll('[data-provider-settings]').forEach(row => {
                const id = row.getAttribute('data-provider-settings');
                providerSettings[id] = {
                    ...(providerSettings[id] || {}),
                    enabled: row.querySelector('[data-provider-enabled]').checked,
                    links: {
                        pricing: parseLinkLines(row.querySelector('[data-links="pricing"]').value),
                        rules: parseLinkLines(row.querySelector('[data-links="rules"]').value),
                        updates: parseLinkLines(row.querySelector('[data-links="updates"]').value)
                    }
                };
            });
            saveProviderSettings(providerSettings);
            saveAppSettings({
                ai: {
                    enabled: bodyContent.querySelector('[data-ai-enabled]').checked,
                    endpoint: bodyContent.querySelector('[data-ai-endpoint]').value.trim(),
                    model: bodyContent.querySelector('[data-ai-model]').value.trim(),
                    apiKey: bodyContent.querySelector('[data-ai-key]').value.trim(),
                    runOnFirstCheck: bodyContent.querySelector('[data-ai-first-check]').checked,
                    maxExcerptChars: Math.min(MAX_AI_EXCERPT_CHARS, Math.max(3000, Number(app.ai.maxExcerptChars) || 14000)),
                    maxEvidenceChars: Math.min(MAX_AI_EVIDENCE_CHARS, Math.max(4000, Number(bodyContent.querySelector('[data-ai-max-evidence-chars]').value) || 9000)),
                    timeoutSeconds: Math.min(300, Math.max(30, Number(bodyContent.querySelector('[data-ai-timeout]').value) || 120)),
                    testTimeoutSeconds: Math.min(300, Math.max(30, Number(bodyContent.querySelector('[data-ai-test-timeout]').value) || 120))
                },
                currency: {
                    display: bodyContent.querySelector('[data-currency-display]').value,
                    rates: bodyContent.querySelector('[data-currency-rates]').value.trim()
                }
            });
            renderSettings();
        });

        bodyContent.querySelector('#llm-reset-settings').addEventListener('click', () => {
            if (!window.confirm('恢复初始默认会清除 API Key、厂商地址、开关、汇率和购物车设置，确定继续吗？')) return;
            saveProviderSettings({});
            saveAppSettings(DEFAULT_APP_SETTINGS);
            saveCalcCart({ targetB: 20, nightPercent: 40, apiMode: API_COST_PROFILES[0].id, customApiCost: 0, quantities: {} });
            renderSettings();
        });
    }

    // ======================== 7. 交互绑定与拖拽控制器 ========================
    renderMatrix();

    modal.querySelectorAll('.llm-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            modal.querySelectorAll('.llm-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.getAttribute('data-target');
            if (target === 'matrix') renderMatrix();
            if (target === 'radar') renderRadar();
            if (target === 'calc') renderCalc();
            if (target === 'settings') renderSettings();
        });
    });

    const closeModal = () => {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    };

    const closeButton = modal.querySelector('#llm-btn-close');
    closeButton.addEventListener('pointerdown', event => event.stopPropagation());
    closeButton.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        closeModal();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && modal.style.display === 'flex') closeModal();
    });

    let isFloaterDragging = false, floaterMoved = false;
    let fStartX, fStartY, fInitLeft, fInitTop;

    floater.addEventListener('pointerdown', (e) => {
        isFloaterDragging = true;
        floaterMoved = false;
        fStartX = e.clientX;
        fStartY = e.clientY;

        const rect = floater.getBoundingClientRect();
        fInitLeft = floaterDockSide === 'right' ? window.innerWidth - floater.offsetWidth : (floaterDockSide === 'left' ? 0 : rect.left);
        fInitTop = rect.top;

        setFloaterDock('', false);

        floater.style.right = 'auto';
        floater.style.bottom = 'auto';
        floater.style.left = `${fInitLeft}px`;
        floater.style.top = `${fInitTop}px`;

        floater.setPointerCapture(e.pointerId);
        document.addEventListener('pointermove', onFloaterMouseMove);
        document.addEventListener('pointerup', onFloaterMouseUp);
        e.preventDefault();
    });

    function onFloaterMouseMove(e) {
        if (!isFloaterDragging) return;
        const dx = e.clientX - fStartX;
        const dy = e.clientY - fStartY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) floaterMoved = true;

        const clampX = Math.max(10, Math.min(window.innerWidth - floater.offsetWidth - 10, fInitLeft + dx));
        const clampY = Math.max(10, Math.min(window.innerHeight - floater.offsetHeight - 10, fInitTop + dy));
        floater.style.left = `${clampX}px`;
        floater.style.top = `${clampY}px`;
    }

    function onFloaterMouseUp() {
        if (!isFloaterDragging) return;
        isFloaterDragging = false;
        document.removeEventListener('pointermove', onFloaterMouseMove);
        document.removeEventListener('pointerup', onFloaterMouseUp);

        if (floaterMoved) {
            const rect = floater.getBoundingClientRect();
            dockFloater(rect.left, rect.top);
        } else {
            modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
            modal.setAttribute('aria-hidden', modal.style.display === 'flex' ? 'false' : 'true');
        }
    }

    floater.addEventListener('mouseenter', () => {
        if (floaterDockSide) setFloaterDock(floaterDockSide, false);
    });
    floater.addEventListener('mouseleave', () => {
        if (floaterDockSide && !isFloaterDragging) setFloaterDock(floaterDockSide, true);
    });
    floater.addEventListener('focus', () => {
        if (floaterDockSide) setFloaterDock(floaterDockSide, false);
    });
    floater.addEventListener('blur', () => {
        if (floaterDockSide && !isFloaterDragging) setFloaterDock(floaterDockSide, true);
    });

    const dragHeader = modal.querySelector('#llm-header-drag');
    let isModalDragging = false, mStartX, mStartY, mInitLeft, mInitTop;

    dragHeader.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button, a, input, select, textarea')) return;
        isModalDragging = true;
        mStartX = e.clientX;
        mStartY = e.clientY;
        const rect = modal.getBoundingClientRect();
        mInitLeft = rect.left;
        mInitTop = rect.top;
        dragHeader.setPointerCapture(e.pointerId);
        document.addEventListener('pointermove', onModalMouseMove);
        document.addEventListener('pointerup', onModalMouseUp);
    });

    function onModalMouseMove(e) {
        if (!isModalDragging) return;
        modal.style.right = 'auto';
        modal.style.left = `${Math.max(10, Math.min(window.innerWidth - modal.offsetWidth - 10, mInitLeft + e.clientX - mStartX))}px`;
        modal.style.top = `${Math.max(10, Math.min(window.innerHeight - modal.offsetHeight - 10, mInitTop + e.clientY - mStartY))}px`;
    }

    function onModalMouseUp() {
        isModalDragging = false;
        document.removeEventListener('pointermove', onModalMouseMove);
        document.removeEventListener('pointerup', onModalMouseUp);
    }

    window.addEventListener('resize', () => {
        const floaterRect = floater.getBoundingClientRect();
        if (floaterDockSide) {
            dockFloater(floaterRect.left, floaterRect.top, true);
        } else if (floater.style.left) {
            floater.style.left = `${Math.max(10, Math.min(window.innerWidth - floater.offsetWidth - 10, floaterRect.left))}px`;
            floater.style.top = `${Math.max(10, Math.min(window.innerHeight - floater.offsetHeight - 10, floaterRect.top))}px`;
        }
        if (modal.style.display === 'flex' && modal.style.left) {
            const modalRect = modal.getBoundingClientRect();
            modal.style.left = `${Math.max(10, Math.min(window.innerWidth - modal.offsetWidth - 10, modalRect.left))}px`;
            modal.style.top = `${Math.max(10, Math.min(window.innerHeight - modal.offsetHeight - 10, modalRect.top))}px`;
        }
    });
})();
