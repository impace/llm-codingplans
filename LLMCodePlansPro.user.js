// ==UserScript==
// @name         大模型代码订阅对比与更新雷达 (LLM CodePlans Pro)
// @namespace    https://github.com/impace/llm-codingplans
// @version      2.2.0
// @description  大模型代码订阅对比、动态更新追踪与极致性价比测算工具
// @author       impace
// @match        *://*/*
// @updateURL    https://raw.githubusercontent.com/impace/llm-codingplans/main/LLMCodePlansPro.user.js
// @downloadURL  https://raw.githubusercontent.com/impace/llm-codingplans/main/LLMCodePlansPro.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
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
            plans: 'Free $0 | Pro $10/月 | Pro+ $39/月 | Max $100/月',
            quotaDesc: '补全、Chat、Agent、Code Review、Cloud Agent 等按 GitHub AI Credits 或计划用量管理',
            models: '模型会动态调整；Pro 支持模型选择，Pro+/Max 提供更多高级模型及额度',
            promos: '学生计划及特定开发者资格可能免费；具体资格以 GitHub 页面为准',
            traps: 'Agent、Chat、代码审查等会共同消耗 AI Credits；不要只按“无限补全”判断重度 Agent 容量',
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
            promos: '非高峰时段按 50% 积分抵扣；另有深夜活动，活动能力需以公告为准',
            traps: '调价后纯价格门槛变高，建议配合年付平摊及闲时策略使用',
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
            plans: '以官方 Token Plan 当前档位为准；已见 Standard ¥99、Pro ¥299、Max ¥599 等积分档',
            quotaDesc: '当前采用积分制，不宜按固定 3.2 亿 Tokens 直接换算',
            models: '腾讯混元、DeepSeek V4 等，以官方可用模型表为准',
            promos: '活动档位和价格可能动态变化',
            traps: '若主要调用第三方模型，折算倍率消耗相对较快',
            verifiedAt: '2026-09-19（官方文档，页面显示 2026-09-10 更新）',
            links: {
                pricing: [
                    { title: 'Token Plan 说明 1', url: 'https://cloud.tencent.com/document/product/1823/130060' },
                    { title: 'Token Plan 说明 2', url: 'https://cloud.tencent.com/document/product/1823/131172' }
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
            models: 'MiMo v2.5 系列及语音模型，以官方 Token Plan 为准',
            promos: '年付约 88 折；开发者激励计划不定期发放算力补贴',
            traps: '积分量足，但跨多文件系统复杂架构生成能力较头部梯队仍有优化空间',
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
            plans: 'Plus 年付折算 ¥79/月 | Pro ¥159/月 | Max ¥559/月（页面同时显示月付原价 ¥99/199/699）',
            quotaDesc: '新会员体系已取消 Code 周限额，总额度按套餐等级管理；官方未公开固定 Token 月容量',
            models: 'Kimi Code；Plus 及更高档位可使用 K3',
            promos: '年付最高立省 ¥1,680；购买 Code Plan 同时获得其他 Kimi 会员权益',
            traps: '官网只描述额度等级与并发差异，没有公布可稳定换算的 Token 总量，重度使用需以控制台实测为准',
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
            quotaDesc: '本地消息和云任务共享计划用量；Pro 提供 Plus 的 5x 或 20x 用量档，也可额外购买 Credits',
            models: 'GPT-5.6 Sol / Terra / Luna 等，以 OpenAI Docs 当前模型表为准',
            promos: 'Codex 可用于 Web、CLI、IDE 扩展和桌面端；Plus/Pro 可购买额外 Credits',
            traps: '限额受模型、上下文、推理强度、工具调用、缓存及本地/云端执行影响，不能视为“无限”',
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
            plans: 'SuperGrok Lite | SuperGrok | SuperGrok Plus | SuperGrok Heavy（价格以当前结算页为准）',
            quotaDesc: '官网以相对倍数展示：Lite 对话长度 2x，SuperGrok 5x；Plus/Heavy 继续提高 Chat、Imagine、Voice 与 Build 用量',
            models: 'Grok 4.6 Chat、专家模式及多智能体能力（按套餐开放）',
            promos: '支持年付优惠；Heavy 可关联 X Premium+ 权益',
            traps: '公开 Plans 页当前不直接展示数字价格和 Token 月容量，不能再沿用旧的 $10/$30 固定价估算',
            verifiedAt: '2026-09-19（Grok 官方 Plans 渲染正文）',
            links: {
                pricing: [{ title: 'Grok 订阅说明', url: 'https://grok.com/plans' }],
                updates: [{ title: '开发者 Release Notes', url: 'https://docs.x.ai/developers/release-notes' }]
            }
        }
    ];

    // ======================== 2. 配置、校验与来源探测 ========================
    const APP_VERSION = '2.2.0';
    const PROVIDER_SETTINGS_KEY = 'llm_provider_settings_v2';
    const SOURCE_PROBE_KEY_PREFIX = 'llm_source_probe_v2_';
    const RENDER_REQUEST_KEY_PREFIX = 'llm_render_request_v1_';
    const SETTINGS_SCHEMA_VERSION = 3;
    const MAX_PROBE_BYTES = 500000;

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function isHttpUrl(value) {
        try {
            const url = new URL(String(value));
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (error) {
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

    function sourceKey(url) {
        return `${SOURCE_PROBE_KEY_PREFIX}${hashText(url)}`;
    }

    function renderRequestKey(url) {
        return `${RENDER_REQUEST_KEY_PREFIX}${hashText(url)}`;
    }

    function formatDate(value) {
        if (!value) return '未检查';
        try {
            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
        } catch (error) {
            return String(value);
        }
    }

    function readProviderSettings() {
        const saved = GM_getValue(PROVIDER_SETTINGS_KEY, {});
        const settings = saved && typeof saved === 'object' ? saved : {};
        if (Number(settings.__schemaVersion || 0) >= SETTINGS_SCHEMA_VERSION) return settings;

        const replacements = new Map([
            ['https://bigmodel.cn/glm-coding', 'https://docs.bigmodel.cn/cn/coding-plan/overview'],
            ['https://www.kimi.com/membership/pricing', 'https://www.kimi.com/code/#pricing']
        ]);
        Object.keys(settings).forEach(id => {
            const provider = settings[id];
            if (!provider || !provider.links) return;
            ['pricing', 'updates'].forEach(type => {
                if (!Array.isArray(provider.links[type])) return;
                provider.links[type] = provider.links[type].map(link => {
                    const replacement = link && replacements.get(String(link.url || '').replace(/\/$/, ''));
                    return replacement ? { ...link, url: replacement } : link;
                });
            });
        });
        settings.__schemaVersion = SETTINGS_SCHEMA_VERSION;
        GM_setValue(PROVIDER_SETTINGS_KEY, settings);
        return settings;
    }

    function normalizeProvider(provider) {
        const source = provider && typeof provider === 'object' ? provider : {};
        return {
            id: String(source.id || '').trim(),
            name: String(source.name || source.id || '未命名厂商').trim(),
            category: String(source.category || '自定义').trim(),
            tag: String(source.tag || '自定义').trim(),
            plans: String(source.plans || '请补充套餐信息').trim(),
            quotaDesc: String(source.quotaDesc || '请补充额度规则').trim(),
            models: String(source.models || '请补充模型信息').trim(),
            promos: String(source.promos || '请补充优惠信息').trim(),
            traps: String(source.traps || '请自行核验限制条件').trim(),
            verifiedAt: String(source.verifiedAt || '未核验').trim(),
            links: {
                pricing: Array.isArray(source.links && source.links.pricing) ? source.links.pricing : [],
                updates: Array.isArray(source.links && source.links.updates) ? source.links.updates : []
            }
        };
    }

    function mergeProviderLinks(provider, savedProvider) {
        provider = normalizeProvider(provider);
        const savedLinks = savedProvider && savedProvider.links && typeof savedProvider.links === 'object'
            ? savedProvider.links
            : {};
        const links = {
            pricing: Array.isArray(provider.links.pricing) ? provider.links.pricing.map(link => ({ ...link })) : [],
            updates: Array.isArray(provider.links.updates) ? provider.links.updates.map(link => ({ ...link })) : []
        };
        ['pricing', 'updates'].forEach(type => {
            if (!Array.isArray(savedLinks[type])) return;
            const customLinks = savedLinks[type]
                .filter(savedLink => savedLink && isHttpUrl(savedLink.url))
                .map(savedLink => ({
                    title: String(savedLink.title || '自定义来源').trim(),
                    url: savedLink.url.trim()
                }));
            if (customLinks.length) links[type] = customLinks;
        });
        return links;
    }

    function getAllProviders() {
        const settings = readProviderSettings();
        const builtinIds = new Set(PROVIDERS_DATA.map(provider => provider.id));
        const customProviders = Array.isArray(settings.__customProviders)
            ? settings.__customProviders.map(normalizeProvider).filter(provider => provider.id && !builtinIds.has(provider.id))
            : [];
        return [...PROVIDERS_DATA.map(normalizeProvider), ...customProviders].map(provider => {
            const savedProvider = settings[provider.id] || {};
            return {
                ...provider,
                custom: !builtinIds.has(provider.id),
                enabled: savedProvider.enabled !== false,
                links: mergeProviderLinks(provider, savedProvider)
            };
        });
    }

    function getEnabledProviders() {
        return getAllProviders().filter(provider => provider.enabled);
    }

    function getUsableLinks(provider, type) {
        return Array.isArray(provider.links && provider.links[type])
            ? provider.links[type].filter(link => link && isHttpUrl(link.url))
            : [];
    }

    function safeHref(url) {
        return isHttpUrl(url) ? escapeHtml(url) : '#';
    }

    function parseLinkLines(value) {
        return String(value || '').split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean)
            .map(line => {
                const separator = line.indexOf('|');
                const title = separator >= 0 ? line.slice(0, separator).trim() : '自定义来源';
                const url = separator >= 0 ? line.slice(separator + 1).trim() : line;
                return { title: title || '自定义来源', url };
            })
            .filter(link => isHttpUrl(link.url));
    }

    function saveProviderSettings(settings) {
        settings.__schemaVersion = SETTINGS_SCHEMA_VERSION;
        GM_setValue(PROVIDER_SETTINGS_KEY, settings);
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

    function getSourceProbeRule(url) {
        try {
            const parsed = new URL(url);
            if (parsed.hostname === 'docs.volcengine.com') {
                return {
                    mode: 'rendered',
                    extractorId: 'volcengine-doc',
                    selectors: ['div[class*="contentdoc-"]', 'div[class*="content-CK"]', 'main'],
                    minLength: 300,
                    markers: ['套餐', '模型'],
                    note: '通过后台官方页面取得渲染后的火山文档正文。'
                };
            }
            if (parsed.hostname === 'bigmodel.cn' && parsed.pathname === '/glm-coding') {
                return { mode: 'fallback', fallbackUrl: 'https://docs.bigmodel.cn/cn/coding-plan/overview', note: 'GLM 营销页为 JavaScript 应用，改用智谱官方 Coding Plan 文档探测。' };
            }
            if (parsed.hostname === 'docs.bigmodel.cn') {
                return {
                    mode: 'rendered',
                    extractorId: 'zhipu-coding-plan',
                    selectors: ['main', 'article', '[class*="markdown"]', 'body'],
                    minLength: 500,
                    markers: ['积分额度', '抵扣系数'],
                    note: '通过后台官方文档取得智谱 Coding Plan 套餐、额度与抵扣系数。'
                };
            }
            if (parsed.hostname === 'www.kimi.com' && parsed.pathname === '/membership/pricing') {
                return { mode: 'fallback', fallbackUrl: 'https://www.kimi.com/code/#pricing', note: '会员价格页为动态页面，改用可读取的 Kimi Code 官方页探测。' };
            }
            if (parsed.hostname === 'www.kimi.com' && /^\/code\/?$/.test(parsed.pathname)) {
                return {
                    mode: 'rendered',
                    extractorId: 'kimi-code-pricing',
                    selectors: ['.kfc-pricing-content', 'main'],
                    minLength: 180,
                    markers: ['Plus', 'Pro', 'Max'],
                    note: '通过后台官方页面取得 Kimi Code 套餐价格与权益。'
                };
            }
            if (parsed.hostname === 'grok.com' && parsed.pathname.startsWith('/plans')) {
                return {
                    mode: 'rendered',
                    extractorId: 'grok-plans',
                    selectors: ['main'],
                    minLength: 260,
                    markers: ['SuperGrok'],
                    note: '通过后台官方页面绕过接口 403，取得 Grok 渲染后的套餐正文。'
                };
            }
        } catch (error) {
            return { mode: 'normal', note: '' };
        }
        return { mode: 'normal', note: '' };
    }

    function requestUpdateCheck(url, previous, requestOptions = {}) {
        return new Promise(resolve => {
            if (!isHttpUrl(url)) {
                resolve({ ok: false, status: 0, error: '地址不是有效的 HTTP(S) URL' });
                return;
            }
            const requestHeaders = {
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            };
            if (previous && previous.etag) requestHeaders['If-None-Match'] = previous.etag;
            if (previous && previous.lastModified) requestHeaders['If-Modified-Since'] = previous.lastModified;
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                timeout: 12000,
                anonymous: true,
                headers: requestHeaders,
                onload: response => {
                    const raw = String(response.responseText || '');
                    const title = (raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
                    const body = sanitizeProbeText(normalizeProbeText(raw));
                    const status = Number(response.status) || 0;
                    if (status === 304) {
                        resolve({
                            ok: true,
                            status,
                            statusText: response.statusText || '',
                            fingerprint: previous && previous.fingerprint ? previous.fingerprint : '',
                            etag: previous && previous.etag ? previous.etag : '',
                            lastModified: previous && previous.lastModified ? previous.lastModified : '',
                            title: previous && previous.title ? previous.title : '',
                            bytes: 0,
                            textLength: previous && previous.textLength ? previous.textLength : 0,
                            facts: previous && previous.facts ? previous.facts : '',
                            preview: previous && previous.preview ? previous.preview : '',
                            weak: Boolean(previous && previous.weak),
                            detectedMarkers: previous && Array.isArray(previous.detectedMarkers) ? previous.detectedMarkers : [],
                            checkedAt: new Date().toISOString(),
                            changed: false,
                            notModified: true,
                            error: ''
                        });
                        return;
                    }
                    const detectedMarkers = Array.isArray(requestOptions.markers)
                        ? requestOptions.markers.filter(marker => body.toLowerCase().includes(String(marker).toLowerCase()))
                        : [];
                    resolve({
                        ok: status >= 200 && status < 400,
                        status,
                        statusText: response.statusText || '',
                        fingerprint: body ? hashText(body) : '',
                        etag: getHeader(response.responseHeaders, 'etag'),
                        lastModified: getHeader(response.responseHeaders, 'last-modified'),
                        title: title.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
                        bytes: raw.length,
                        textLength: body.length,
                        facts: buildContentFacts(body),
                        preview: body.slice(0, 220),
                        weak: body.length < 180,
                        detectedMarkers,
                        checkedAt: new Date().toISOString(),
                        error: status >= 200 && status < 400 ? '' : `HTTP ${status}`
                    });
                },
                onerror: () => resolve({ ok: false, status: 0, error: '网络错误、跨域限制或站点拒绝请求' }),
                ontimeout: () => resolve({ ok: false, status: 0, error: '请求超时（12 秒）' })
            });
        });
    }

    function extractRenderedText(rule) {
        const selectors = Array.isArray(rule.selectors) && rule.selectors.length
            ? rule.selectors
            : ['main', 'article', '[role="main"]', 'body'];
        const candidates = [];
        selectors.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach(node => {
                    const text = String(node.innerText || node.textContent || '').trim();
                    if (text) candidates.push(text);
                });
            } catch (error) {
                // 用户自定义地址出现无效选择器时继续使用其他候选容器。
            }
        });
        const longest = candidates.sort((a, b) => b.length - a.length)[0] || '';
        return sanitizeProbeText(longest).slice(0, MAX_PROBE_BYTES);
    }

    function buildContentFacts(text) {
        const source = String(text || '');
        const prices = [...new Set((source.match(/[¥￥]\s*[0-9][0-9,.]*/g) || []).map(item => item.replace(/\s+/g, '')))].slice(0, 5);
        const planNames = ['Lite', 'Pro', 'Plus', 'Max', 'Heavy', 'Ultra', 'Team'];
        const plans = planNames.filter(name => new RegExp('(^|[^A-Za-z])' + name + '(?=$|[^A-Za-z])', 'i').test(source)).map(name => name.toUpperCase()).slice(0, 6);
        const pairedPrices = planNames.map(name => {
            const match = source.match(new RegExp('(^|[^A-Za-z])' + name + '(?=$|[^A-Za-z])[^¥￥]{0,160}[¥￥]\\s*([0-9][0-9,.]*)', 'i'));
            return match ? name.toUpperCase() + ' ¥' + match[2] : '';
        }).filter(Boolean).slice(0, 5);
        const eventCount = (source.match(/模型(?:新增|上线|下线|更新)/g) || []).length;
        const updatedAt = (source.match(/最近更新时间[：:]?\s*([0-9./:\- ]{8,25})/) || [])[1] || '';
        const facts = [];
        if (pairedPrices.length) facts.push('价格 ' + pairedPrices.join('、'));
        else if (prices.length) facts.push('价格 ' + prices.join('、'));
        if (plans.length) facts.push('套餐 ' + plans.join('、'));
        if (eventCount) facts.push('模型动态 ' + eventCount + ' 条');
        if (updatedAt.trim()) facts.push('官方更新 ' + updatedAt.trim());
        return facts.join('；');
    }

    function captureRenderedSourceIfRequested() {
        const match = String(location.hash || '').match(/(?:^|[&#])llm-codeplans-probe=([a-f0-9]{8})/i);
        if (!match) return;
        const requestKey = RENDER_REQUEST_KEY_PREFIX + match[1];
        const request = GM_getValue(requestKey, null);
        if (!request || request.state !== 'pending') return;

        const rule = request.rule && typeof request.rule === 'object' ? request.rule : {};
        const minLength = Math.max(120, Number(rule.minLength) || 180);
        const startedAt = Date.now();
        let lastText = '';
        let stableRounds = 0;
        const collect = () => {
            const text = extractRenderedText(rule);
            stableRounds = text && text === lastText ? stableRounds + 1 : 0;
            lastText = text;
            const markerList = Array.isArray(rule.markers) ? rule.markers : [];
            const markerHits = markerList.filter(marker => text.toLowerCase().includes(String(marker).toLowerCase()));
            const blocked = /access denied|forbidden|just a moment|enable cookies|verify you are human|captcha|访问被拒绝|安全验证|人机验证/i.test(text);
            const enough = text.length >= minLength && !blocked && (!markerList.length || markerHits.length > 0);
            const timedOut = Date.now() - startedAt > 22000;
            if ((!enough || stableRounds < 2) && !timedOut) {
                setTimeout(collect, 500);
                return;
            }
            GM_setValue(requestKey, {
                state: 'done',
                ok: enough,
                error: enough ? '' : (blocked ? '页面进入安全验证/反爬拦截，未把拦截页当作正文' : '渲染完成但有效正文不足 ' + minLength + ' 字'),
                sourceUrl: request.sourceUrl,
                checkedAt: new Date().toISOString(),
                title: document.title,
                textLength: text.length,
                fingerprint: text ? hashText(text) : '',
                detectedMarkers: markerHits,
                facts: buildContentFacts(text),
                preview: text.slice(0, 220),
                extractorId: rule.extractorId || 'generic-rendered'
            });
            setTimeout(() => window.close(), 300);
        };
        setTimeout(collect, 700);
    }

    function requestRenderedSource(url, previous, rule) {
        return new Promise(resolve => {
            const id = hashText(url);
            const requestKey = RENDER_REQUEST_KEY_PREFIX + id;
            const source = new URL(url);
            source.hash = source.hash
                ? source.hash + '&llm-codeplans-probe=' + id
                : 'llm-codeplans-probe=' + id;
            GM_setValue(requestKey, {
                state: 'pending',
                sourceUrl: url,
                requestedAt: new Date().toISOString(),
                rule: {
                    extractorId: rule.extractorId || 'generic-rendered',
                    selectors: rule.selectors || ['main', 'article', '[role="main"]', 'body'],
                    minLength: rule.minLength || 180,
                    markers: rule.markers || []
                }
            });

            let openedTab;
            try {
                openedTab = GM_openInTab(source.href, { active: false, insert: true, setParent: true });
            } catch (error) {
                resolve({ ok: false, error: '无法打开后台采集页：' + (error.message || error) });
                return;
            }
            const startedAt = Date.now();
            const poll = () => {
                const response = GM_getValue(requestKey, null);
                if (response && response.state === 'done') {
                    if (openedTab && typeof openedTab.close === 'function') openedTab.close();
                    resolve({
                        ...response,
                        rendered: true,
                        weak: !response.ok,
                        changed: Boolean(response.ok && previous && previous.fingerprint && previous.fingerprint !== response.fingerprint),
                        previousCheckedAt: previous && previous.checkedAt ? previous.checkedAt : ''
                    });
                    return;
                }
                if (Date.now() - startedAt > 26000) {
                    if (openedTab && typeof openedTab.close === 'function') openedTab.close();
                    resolve({ ok: false, rendered: true, error: '浏览器正文采集超时（26 秒）' });
                    return;
                }
                setTimeout(poll, 500);
            };
            setTimeout(poll, 500);
        });
    }

    async function probeSource(url, requestOptions = {}) {
        const previous = GM_getValue(sourceKey(url), null);
        const rule = getSourceProbeRule(url);
        const effectiveUrl = rule.fallbackUrl || url;
        const effectiveRule = rule.fallbackUrl ? getSourceProbeRule(effectiveUrl) : rule;
        let result = effectiveRule.mode === 'rendered'
            ? await requestRenderedSource(effectiveUrl, previous, effectiveRule)
            : await requestUpdateCheck(effectiveUrl, previous, requestOptions);
        if (effectiveRule.mode !== 'rendered' && (!result.ok || result.weak) && typeof GM_openInTab === 'function') {
            const renderedRule = {
                ...effectiveRule,
                mode: 'rendered',
                extractorId: (effectiveRule.extractorId || 'generic') + '-browser-fallback',
                selectors: effectiveRule.selectors || ['main', 'article', '[role="main"]', 'body'],
                minLength: effectiveRule.minLength || 180,
                markers: effectiveRule.markers || []
            };
            const renderedResult = await requestRenderedSource(effectiveUrl, previous, renderedRule);
            if (renderedResult.ok) result = renderedResult;
        }
        result.probeMode = effectiveRule.mode;
        result.note = [rule.note, effectiveRule.note].filter(Boolean).join('；');
        result.effectiveUrl = effectiveUrl;
        if (result.ok) {
            result.fallbackUsed = rule.mode === 'fallback';
            result.changed = Boolean(previous && previous.fingerprint && previous.fingerprint !== result.fingerprint);
            result.previousCheckedAt = previous && previous.checkedAt ? previous.checkedAt : '';
            result.lastError = '';
            GM_setValue(sourceKey(url), result);
            return result;
        }
        const retained = previous && typeof previous === 'object' ? { ...previous } : {};
        retained.lastError = result.error || '来源检查失败';
        retained.lastAttemptAt = new Date().toISOString();
        retained.ok = Boolean(previous && previous.ok);
        retained.error = retained.ok ? '' : retained.lastError;
        GM_setValue(sourceKey(url), retained);
        return {
            ...retained,
            attemptFailed: true,
            attemptError: result.error || '来源检查失败',
            retained,
            previousCheckedAt: previous && previous.checkedAt ? previous.checkedAt : ''
        };
    }

    function probeSummary(probe, url) {
        const rule = getSourceProbeRule(url || '');
        if (probe && probe.attemptFailed && probe.ok) {
            return { label: '最近检查失败：' + (probe.attemptError || probe.lastError || '未知错误') + '；保留 ' + formatDate(probe.checkedAt) + ' 的成功结果', color: '#e3b341' };
        }
        if (rule.mode === 'rendered' && probe && !probe.rendered && !probe.attemptFailed) {
            return { label: '采集规则已升级，请重新检查以取得渲染正文', color: '#e3b341' };
        }
        if (rule.mode === 'fallback' && probe && probe.effectiveUrl !== rule.fallbackUrl) {
            return { label: `探测规则已更新，请重新检查；${rule.note}`, color: '#e3b341' };
        }
        if (!probe) return { label: rule.mode === 'rendered' ? '未检查；将自动打开后台页采集渲染正文' : '未检查', color: '#8b949e' };
        if (probe.rendered && probe.ok) {
            const prefix = probe.changed ? '渲染正文有变化' : '已取得渲染正文';
            const facts = probe.facts ? '；' + probe.facts : '';
            return { label: prefix + ' · ' + Number(probe.textLength || 0).toLocaleString() + ' 字' + facts + '（' + formatDate(probe.checkedAt) + '）', color: probe.changed ? '#e3b341' : '#3fb950' };
        }
        if (rule.mode === 'fallback' && probe.ok) {
            const prefix = probe.changed ? '备用官方页有变化' : '备用官方页正常';
            return { label: `${prefix}（${formatDate(probe.checkedAt)}）；${rule.note}`, color: probe.changed ? '#e3b341' : '#3fb950' };
        }
        if (rule.mode === 'fallback' && probe.weak) return { label: `请重新检查；${rule.note}`, color: '#e3b341' };
        if (!probe.ok) {
            const lastGood = probe.retained && probe.retained.checkedAt
                ? `；上次成功：${formatDate(probe.retained.checkedAt)}`
                : '';
            return { label: `失败：${probe.error || '未知错误'}${lastGood}`, color: '#f85149' };
        }
        if (probe.changed) return { label: `页面有变化（${formatDate(probe.checkedAt)}）`, color: '#e3b341' };
        if (probe.weak) return { label: `响应过短，可能是登录页或 JS 壳（${formatDate(probe.checkedAt)}）`, color: '#e3b341' };
        const length = Number(probe.textLength || probe.bytes || 0).toLocaleString();
        return { label: '已取得正文 · ' + length + ' 字（' + formatDate(probe.checkedAt) + '）', color: '#3fb950' };
    }

    captureRenderedSourceIfRequested();
    if (/(?:^|[&#])llm-codeplans-probe=[a-f0-9]{8}/i.test(String(location.hash || ''))) return;

    // ======================== 3. 注入样式 ========================
    const STYLES = `
        :root {
            --llm-bg: rgba(22, 27, 34, 0.9);
            --llm-card: rgba(33, 38, 45, 0.78);
            --llm-border: rgba(240, 246, 252, 0.14);
            --llm-primary: #3b82f6;
            --llm-text: #f0f6fc;
            --llm-text-dim: #8b949e;
            --llm-green: #238636;
            --llm-amber: #d29922;
        }
        #llm-floater {
            position: fixed;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: linear-gradient(135deg, #1f6feb, #238636);
            box-shadow: 0 8px 24px rgba(0,0,0,0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            cursor: grab;
            z-index: 999998;
            user-select: none;
            touch-action: none;
            transition: box-shadow 0.2s ease, transform 0.1s ease;
        }
        #llm-floater:active {
            cursor: grabbing;
            transform: scale(0.96);
        }
        #llm-floater svg { width: 24px; height: 24px; pointer-events: none; }
        #llm-modal {
            position: fixed;
            top: 80px;
            right: 25px;
            width: 820px;
            max-width: calc(100vw - 30px);
            height: 640px;
            max-height: calc(100vh - 100px);
            background: var(--llm-bg);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid var(--llm-border);
            border-radius: 16px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.6);
            z-index: 999999;
            display: none;
            flex-direction: column;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: var(--llm-text);
        }
        .llm-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 18px;
            background: rgba(255, 255, 255, 0.04);
            border-bottom: 1px solid var(--llm-border);
            cursor: move;
        }
        .llm-title {
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .llm-badge-version {
            font-size: 11px;
            padding: 2px 6px;
            background: rgba(56, 139, 253, 0.15);
            color: #58a6ff;
            border-radius: 12px;
            border: 1px solid rgba(56, 139, 253, 0.3);
        }
        .llm-actions { display: flex; gap: 8px; }
        .llm-btn-icon {
            background: transparent;
            border: none;
            color: var(--llm-text-dim);
            cursor: pointer;
            padding: 4px;
            border-radius: 6px;
            font-size: 14px;
            transition: all 0.15s;
        }
        .llm-btn-icon:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
        .llm-tabs {
            display: flex;
            background: rgba(0, 0, 0, 0.25);
            padding: 4px 14px;
            gap: 6px;
            border-bottom: 1px solid var(--llm-border);
        }
        .llm-tab {
            padding: 6px 12px;
            font-size: 13px;
            cursor: pointer;
            border-radius: 6px;
            color: var(--llm-text-dim);
            transition: all 0.2s;
            user-select: none;
        }
        .llm-tab:hover { color: #fff; background: rgba(255, 255, 255, 0.05); }
        .llm-tab.active { color: #fff; background: var(--llm-primary); font-weight: 500; }
        .llm-body {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
        }
        .llm-body::-webkit-scrollbar { width: 6px; }
        .llm-body::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 3px; }
        .llm-card {
            background: var(--llm-card);
            border: 1px solid var(--llm-border);
            border-radius: 10px;
            padding: 12px 14px;
            margin-bottom: 10px;
        }
        .llm-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        }
        .llm-provider-name {
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .llm-provider-tag {
            font-size: 10px;
            padding: 1px 5px;
            border-radius: 4px;
            background: rgba(35, 134, 54, 0.2);
            color: #3fb950;
            border: 1px solid rgba(35, 134, 54, 0.3);
        }
        .llm-grid-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            font-size: 12px;
            margin-bottom: 6px;
            color: #c9d1d9;
        }
        .llm-highlight-promo {
            background: rgba(210, 153, 34, 0.12);
            border-left: 3px solid var(--llm-amber);
            padding: 6px 10px;
            border-radius: 0 6px 6px 0;
            font-size: 12px;
            color: #e3b341;
            margin-bottom: 6px;
        }
        .llm-card-links { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
        .llm-link-chip {
            font-size: 11px;
            color: #58a6ff;
            background: rgba(56, 139, 253, 0.12);
            padding: 3px 8px;
            border-radius: 6px;
            text-decoration: none;
            transition: all 0.15s;
        }
        .llm-link-chip:hover { background: var(--llm-primary); color: #fff; }
        .llm-calc-box {
            background: var(--llm-card);
            border: 1px solid var(--llm-border);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 14px;
        }
        .llm-input-group {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 13px;
        }
        .llm-input-num {
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid var(--llm-border);
            color: #fff;
            padding: 6px 10px;
            border-radius: 6px;
            width: 100px;
            text-align: center;
        }
        .llm-rank-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 14px;
            background: rgba(255,255,255,0.03);
            border-radius: 8px;
            margin-bottom: 6px;
            font-size: 13px;
        }
        .llm-btn {
            border: 1px solid var(--llm-border);
            background: rgba(56,139,253,0.14);
            color: #dbeafe;
            cursor: pointer;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 12px;
        }
        .llm-btn:hover { background: var(--llm-primary); color: #fff; }
        .llm-btn:disabled { opacity: 0.55; cursor: wait; }
        .llm-settings-row {
            background: var(--llm-card);
            border: 1px solid var(--llm-border);
            border-radius: 10px;
            padding: 12px 14px;
            margin-bottom: 10px;
        }
        .llm-settings-row textarea {
            width: 100%;
            min-height: 54px;
            box-sizing: border-box;
            resize: vertical;
            margin-top: 5px;
            background: rgba(0,0,0,0.35);
            border: 1px solid var(--llm-border);
            color: #fff;
            border-radius: 6px;
            padding: 7px 9px;
            font: 12px/1.5 ui-monospace, SFMono-Regular, Consolas, monospace;
        }
        .llm-settings-label {
            display: block;
            margin-top: 8px;
            color: var(--llm-text-dim);
            font-size: 11px;
        }
        .llm-source-status { font-size: 11px; margin-top: 5px; line-height: 1.4; }
        .llm-muted { color: var(--llm-text-dim); font-size: 11px; line-height: 1.5; }
    `;

    const styleEl = document.createElement('style');
    styleEl.innerHTML = STYLES;
    document.head.appendChild(styleEl);

    // ======================== 3. DOM 节点构建 ========================
    const floater = document.createElement('div');
    floater.id = 'llm-floater';
    floater.title = '长按可拖动，点击展开比价雷达';
    floater.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"></path><path d="m9 12 2 2 4-4"></path></svg>`;
    document.body.appendChild(floater);

    // 恢复历史记忆位置 (默认右下角)
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

    const modal = document.createElement('div');
    modal.id = 'llm-modal';
    modal.innerHTML = `
        <div class="llm-header" id="llm-header-drag">
            <div class="llm-title">
                <span>🤖 LLM CodePlans Pro</span>
                <span class="llm-badge-version">v${APP_VERSION}</span>
            </div>
            <div class="llm-actions">
                <button class="llm-btn-icon" id="llm-btn-close" title="关闭">✕</button>
            </div>
        </div>
        <div class="llm-tabs">
            <div class="llm-tab active" data-target="matrix">📊 套餐比价矩阵</div>
            <div class="llm-tab" data-target="radar">📢 动态更新雷达</div>
            <div class="llm-tab" data-target="calc">🧮 月度成本测算</div>
            <div class="llm-tab" data-target="settings">⚙️ 厂商配置</div>
        </div>
        <div class="llm-body" id="llm-body-content"></div>
    `;
    document.body.appendChild(modal);

    const bodyContent = modal.querySelector('#llm-body-content');

    // ======================== 4. 视图业务逻辑 ========================
    function renderMatrix() {
        const providers = getEnabledProviders();
        let html = `
            <div style="margin-bottom: 10px;">
                <input type="text" id="llm-search-input" placeholder="🔍 过滤厂商或模型 (如 Qwen, DeepSeek, 智谱)..." style="
                    background: rgba(0,0,0,0.3); border: 1px solid var(--llm-border); color: #fff; padding: 7px 12px; border-radius: 8px; width: 100%; font-size: 12px; box-sizing: border-box; outline: none;
                " />
            </div>
            <div class="llm-muted" style="margin-bottom: 10px;">当前启用 ${providers.length} 家厂商。配置页可以暂时移出厂商或修改来源地址。</div>
            <div id="llm-cards-list">
        `;
        providers.forEach(p => {
            const pricingLinks = getUsableLinks(p, 'pricing');
            const updateLinks = getUsableLinks(p, 'updates');
            const keyword = [p.name, p.models, p.category, p.tag, p.plans, p.promos, p.traps].join(' ');
            html += `
                <div class="llm-card" data-kw="${escapeHtml(keyword)}">
                    <div class="llm-card-header">
                        <div class="llm-provider-name">
                            <span>${escapeHtml(p.name)}</span>
                            <span class="llm-provider-tag">${escapeHtml(p.tag)}</span>
                            <span style="font-size: 11px; color: var(--llm-text-dim);">(${escapeHtml(p.category)})</span>
                        </div>
                        <div style="font-weight: 600; color: #58a6ff; font-size: 13px; text-align: right; max-width: 55%;">${escapeHtml(p.plans)}</div>
                    </div>
                    <div class="llm-grid-details">
                        <div><strong>📦 额度规则：</strong>${escapeHtml(p.quotaDesc)}</div>
                        <div><strong>🧠 主力模型：</strong>${escapeHtml(p.models)}</div>
                    </div>
                    <div class="llm-highlight-promo">🎁 <strong>活动优惠：</strong>${escapeHtml(p.promos)}</div>
                    <div style="font-size: 11px; color: #f85149; margin-bottom: 6px;">⚠️ <strong>避坑提示：</strong>${escapeHtml(p.traps)}</div>
                    <div class="llm-muted">数据核验：${escapeHtml(p.verifiedAt)}</div>
                    <div class="llm-card-links">
                        ${pricingLinks.map(l => `<a href="${safeHref(l.url)}" target="_blank" rel="noopener noreferrer" class="llm-link-chip">💳 ${escapeHtml(l.title)}</a>`).join('')}
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
            <details class="llm-settings-row" open style="margin-bottom: 12px;">
                <summary style="cursor:pointer; font-size:13px; font-weight:600;">操作说明（建议先看）</summary>
                <div class="llm-muted" style="margin-top:8px; line-height:1.65;">
                    <div><strong style="color:#f0f6fc;">检查全部来源：</strong>联网检查全部已启用厂商的定价页和更新页，并与上次成功取得的正文比较。</div>
                    <div><strong style="color:#f0f6fc;">仅检查定价：</strong>只检查套餐/价格来源，不检查版本公告，适合快速确认价格与额度变化。</div>
                    <div><strong style="color:#f0f6fc;">重新读取本地状态：</strong>不联网，只重新显示 Tampermonkey 已保存的最近结果。</div>
                    <div style="margin-top:5px;">动态站点会短暂打开后台标签页，等待官方页面完成渲染后提取正文并自动关闭。绿色=已取得正文且无变化；黄色=检测到变化或使用备用官方页；红色=本次失败；灰色=尚未检查。失败时仍保留上次成功快照。</div>
                    <div style="margin-top:5px;">“页面有变化”只表示正文指纹变化，仍建议点“打开来源”确认具体是价格、模型还是文案调整。</div>
                </div>
            </details>
            <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
                <button class="llm-btn" id="llm-probe-all" title="联网检查全部已启用的定价与更新来源">检查全部来源</button>
                <button class="llm-btn" id="llm-probe-pricing" title="联网但只检查套餐和价格来源">仅检查定价</button>
                <button class="llm-btn" id="llm-radar-refresh" title="不联网，只重绘已保存的检查结果">重新读取本地状态</button>
            </div>
        `;
        providers.forEach(p => {
            [...getUsableLinks(p, 'pricing').map(link => ({ ...link, kind: 'pricing' })), ...getUsableLinks(p, 'updates').map(link => ({ ...link, kind: 'updates' }))].forEach(up => {
                const key = `llm_view_${p.id}_${encodeURIComponent(up.title)}`;
                const last = GM_getValue(key, '未读');
                const summary = probeSummary(GM_getValue(sourceKey(up.url), null), up.url);
                html += `
                    <div class="llm-settings-row" data-source-card="${escapeHtml(up.url)}">
                        <div style="display: flex; justify-content: space-between; gap: 10px; align-items: flex-start;">
                            <div style="min-width: 0;">
                                <div style="font-size: 13px;"><strong style="color: #58a6ff;">[${escapeHtml(p.name)}]</strong> <span class="llm-muted">${up.kind === 'pricing' ? '定价' : '更新'}</span> ${escapeHtml(up.title)}</div>
                                <div style="font-size: 11px; color: var(--llm-text-dim); margin-top: 3px;">上次打开：${escapeHtml(last)}</div>
                                <div class="llm-source-status" data-source-status style="color: ${summary.color};">来源检查：${escapeHtml(summary.label)}</div>
                            </div>
                            <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end;">
                                <button class="llm-btn llm-probe-one" data-url="${safeHref(up.url)}" data-kind="${up.kind}">检查</button>
                                <a href="${safeHref(up.url)}" target="_blank" rel="noopener noreferrer" class="llm-link-chip track-read" data-key="${escapeHtml(key)}" style="font-size: 12px; padding: 5px 10px;">打开来源 ↗</a>
                            </div>
                        </div>
                    </div>
                `;
            });
        });
        bodyContent.innerHTML = html;

        bodyContent.querySelectorAll('.track-read').forEach(el => {
            el.addEventListener('click', () => {
                GM_setValue(el.getAttribute('data-key'), new Date().toLocaleDateString());
            });
        });

        const checkOne = async button => {
            const url = button.getAttribute('data-url');
            const card = button.closest('[data-source-card]');
            const status = card && card.querySelector('[data-source-status]');
            button.disabled = true;
            if (status) { status.textContent = '来源检查：检查中…'; status.style.color = '#e3b341'; }
            const result = await probeSource(url);
            const next = probeSummary(result, url);
            if (status) { status.textContent = `来源检查：${next.label}`; status.style.color = next.color; }
            button.disabled = false;
        };
        bodyContent.querySelectorAll('.llm-probe-one').forEach(button => {
            button.addEventListener('click', () => checkOne(button));
        });
        bodyContent.querySelector('#llm-probe-all').addEventListener('click', async event => {
            event.currentTarget.disabled = true;
            for (const button of bodyContent.querySelectorAll('.llm-probe-one')) await checkOne(button);
            event.currentTarget.disabled = false;
        });
        bodyContent.querySelector('#llm-radar-refresh').addEventListener('click', renderRadar);
        bodyContent.querySelector('#llm-probe-pricing').addEventListener('click', async event => {
            event.currentTarget.disabled = true;
            for (const button of bodyContent.querySelectorAll('.llm-probe-one[data-kind="pricing"]')) await checkOne(button);
            event.currentTarget.disabled = false;
        });
    }

    function renderSettings() {
        const providers = getAllProviders();
        let html = `
            <div class="llm-muted" style="margin-bottom: 12px;">
                配置保存在 Tampermonkey 本地存储。关闭开关会把厂商从所有比较视图移出；地址修改只覆盖本地配置。每行格式：标题 | https://example.com/path
            </div>
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                <button class="llm-btn" id="llm-save-settings">保存全部配置</button>
                <button class="llm-btn" id="llm-reset-settings">清除本地覆盖</button>
            </div>
            <details class="llm-settings-row" style="margin-bottom: 12px;">
                <summary style="cursor: pointer; font-size: 13px; font-weight: 600;">新增自定义厂商</summary>
                <label class="llm-settings-label">唯一 ID（小写字母、数字、短横线）</label>
                <input id="llm-custom-id" class="llm-input-num" style="width:100%; text-align:left; box-sizing:border-box;" placeholder="example-provider" />
                <label class="llm-settings-label">厂商名称</label>
                <input id="llm-custom-name" class="llm-input-num" style="width:100%; text-align:left; box-sizing:border-box;" placeholder="示例厂商" />
                <label class="llm-settings-label">套餐摘要</label>
                <input id="llm-custom-plans" class="llm-input-num" style="width:100%; text-align:left; box-sizing:border-box;" placeholder="Lite ¥39/月 | Pro ¥199/月" />
                <label class="llm-settings-label">定价地址（每行：标题 | URL）</label>
                <textarea id="llm-custom-pricing"></textarea>
                <label class="llm-settings-label">更新地址（每行：标题 | URL）</label>
                <textarea id="llm-custom-updates"></textarea>
                <div style="margin-top:8px;"><button class="llm-btn" id="llm-add-provider">添加厂商</button> <span id="llm-custom-error" class="llm-muted"></span></div>
            </details>
        `;
        providers.forEach(p => {
            const pricing = getUsableLinks(p, 'pricing');
            const updates = getUsableLinks(p, 'updates');
            html += `
                <div class="llm-settings-row" data-provider-settings="${escapeHtml(p.id)}">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                        <label style="font-size: 13px; font-weight: 600;">
                            <input type="checkbox" data-provider-enabled ${p.enabled ? 'checked' : ''} />
                            ${escapeHtml(p.name)} <span class="llm-muted">(${escapeHtml(p.category)})</span>
                        </label>
                        <button class="llm-btn ${p.custom ? 'llm-remove-provider' : 'llm-reset-provider'}" type="button">${p.custom ? '移除自定义厂商' : '恢复默认地址'}</button>
                    </div>
                    <label class="llm-settings-label">定价/套餐地址</label>
                    <textarea data-links="pricing">${escapeHtml(pricing.map(link => `${link.title} | ${link.url}`).join('\n'))}</textarea>
                    <label class="llm-settings-label">更新/公告地址</label>
                    <textarea data-links="updates">${escapeHtml(updates.map(link => `${link.title} | ${link.url}`).join('\n'))}</textarea>
                </div>
            `;
        });
        bodyContent.innerHTML = html;

        bodyContent.querySelector('#llm-save-settings').addEventListener('click', () => {
            const settings = readProviderSettings();
            bodyContent.querySelectorAll('[data-provider-settings]').forEach(row => {
                const id = row.getAttribute('data-provider-settings');
                const previous = settings[id] && typeof settings[id] === 'object' ? settings[id] : {};
                settings[id] = {
                    ...previous,
                    enabled: row.querySelector('[data-provider-enabled]').checked,
                    links: {
                        pricing: parseLinkLines(row.querySelector('[data-links="pricing"]').value),
                        updates: parseLinkLines(row.querySelector('[data-links="updates"]').value)
                    }
                };
            });
            saveProviderSettings(settings);
            renderSettings();
        });
        bodyContent.querySelector('#llm-reset-settings').addEventListener('click', () => {
            saveProviderSettings({});
            renderSettings();
        });
        bodyContent.querySelector('#llm-add-provider').addEventListener('click', () => {
            const id = bodyContent.querySelector('#llm-custom-id').value.trim().toLowerCase();
            const error = bodyContent.querySelector('#llm-custom-error');
            const builtinIds = new Set(PROVIDERS_DATA.map(provider => provider.id));
            const settings = readProviderSettings();
            const customProviders = Array.isArray(settings.__customProviders) ? settings.__customProviders : [];
            if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(id)) { error.textContent = 'ID 格式无效。'; return; }
            if (builtinIds.has(id) || customProviders.some(provider => provider.id === id)) { error.textContent = 'ID 已存在。'; return; }
            const name = bodyContent.querySelector('#llm-custom-name').value.trim();
            if (!name) { error.textContent = '请填写厂商名称。'; return; }
            customProviders.push({
                id,
                name,
                category: '自定义',
                tag: '自定义',
                plans: bodyContent.querySelector('#llm-custom-plans').value.trim() || '请补充套餐信息',
                quotaDesc: '请根据官方文档补充额度规则',
                models: '请根据官方文档补充模型信息',
                promos: '请自行核验当前活动',
                traps: '自定义条目尚未经过脚本维护者核验',
                verifiedAt: '用户自定义，未核验',
                links: {
                    pricing: parseLinkLines(bodyContent.querySelector('#llm-custom-pricing').value),
                    updates: parseLinkLines(bodyContent.querySelector('#llm-custom-updates').value)
                }
            });
            settings.__customProviders = customProviders;
            saveProviderSettings(settings);
            renderSettings();
        });
        bodyContent.querySelectorAll('.llm-reset-provider').forEach(button => {
            button.addEventListener('click', () => {
                const row = button.closest('[data-provider-settings]');
                const id = row.getAttribute('data-provider-settings');
                const settings = readProviderSettings();
                if (settings[id]) {
                    const next = { ...settings[id] };
                    delete next.links;
                    settings[id] = next;
                    saveProviderSettings(settings);
                }
                renderSettings();
            });
        });
        bodyContent.querySelectorAll('.llm-remove-provider').forEach(button => {
            button.addEventListener('click', () => {
                const row = button.closest('[data-provider-settings]');
                const id = row.getAttribute('data-provider-settings');
                const settings = readProviderSettings();
                settings.__customProviders = Array.isArray(settings.__customProviders)
                    ? settings.__customProviders.filter(provider => provider.id !== id)
                    : [];
                delete settings[id];
                saveProviderSettings(settings);
                renderSettings();
            });
        });
    }

    const API_COST_PROFILES = {
        deepseekFlash: {
            label: 'DeepSeek V4.1 Flash',
            cachedInputPeak: 0.04,
            uncachedInputPeak: 2,
            outputPeak: 8,
            source: 'https://api-docs.deepseek.com/zh-cn/quick_start/pricing'
        },
        deepseekPro: {
            label: 'DeepSeek V4 Pro',
            cachedInputPeak: 0.30,
            uncachedInputPeak: 9,
            outputPeak: 27,
            source: 'https://api-docs.deepseek.com/zh-cn/quick_start/pricing'
        }
    };

    const SUBSCRIPTION_PROFILES = [
        {
            providerId: 'zhipu',
            provider: '智谱 AI',
            kind: 'coefficient',
            confidence: '高',
            models: {
                economy: { label: 'GLM-5.3-Flash', cached: 0.56, input: 2.3, output: 8 },
                flagship: { label: 'GLM-5.3', cached: 1.7, input: 6.9, output: 24 }
            },
            plans: [
                { name: 'Lite', price: 118, fiveHour: 2000, weekly: 10000 },
                { name: 'Pro', price: 538, fiveHour: 12000, weekly: 60000 },
                { name: 'Max', price: 1078, fiveHour: 28000, weekly: 140000 }
            ],
            note: '按官方积分系数、5 小时和每周双窗口估算；夜间活动的“无限/翻倍”不计入保守容量。'
        },
        {
            providerId: 'mimo',
            provider: '小米 MiMo',
            kind: 'credit',
            confidence: '高',
            models: {
                economy: { label: 'MiMo v2.5', cached: 2, input: 100, output: 200 },
                flagship: { label: 'MiMo v2.5 Pro', cached: 2.5, input: 300, output: 600 }
            },
            plans: [
                { name: 'Lite', price: 39, monthly: 4.1e9 },
                { name: 'Standard', price: 99, monthly: 11e9 },
                { name: 'Pro', price: 329, monthly: 38e9 },
                { name: 'Max', price: 659, monthly: 82e9 }
            ],
            note: '按官方每 Token Credits 系数估算；MiMo 夜间按 0.8 倍 Credits 消耗。'
        },
        {
            providerId: 'volcengine',
            provider: '火山方舟',
            kind: 'requests',
            confidence: '中',
            plans: [
                { name: 'Lite', price: 40, fiveHour: 1200, monthly: 18000 },
                { name: 'Pro', price: 200, fiveHour: 6000, monthly: 90000 }
            ],
            note: '请求制容量高度依赖每轮真实上下文；雷达可通过后台官方页取得动态文档正文，但容量仍应结合实际请求 Token 校准。'
        },
        {
            providerId: 'qianfan',
            provider: '百度千帆',
            kind: 'requests',
            confidence: '高',
            plans: [
                { name: 'Lite', price: 40, fiveHour: 1200, weekly: 9000, monthly: 18000 },
                { name: 'Pro', price: 200, fiveHour: 6000, weekly: 45000, monthly: 90000 }
            ],
            note: '按 5 小时、每周、每月请求窗口中的最小容量计算。'
        },
        {
            providerId: 'bailian',
            provider: '阿里百炼',
            kind: 'weeklyCalibration',
            confidence: '需校准',
            plans: [
                { name: 'Lite', price: 39, weekly: 2500 },
                { name: 'Essential', price: 79, weekly: 5625 },
                { name: 'Standard', price: 139, weekly: 10000 },
                { name: 'Pro', price: 499, weekly: 40000 }
            ],
            note: '官方说明单次 Credits 会随模型、Token、思考和工具动态变化；请填入自己的实测 Credits/1M Token。'
        },
        {
            providerId: 'tencent',
            provider: '腾讯云',
            kind: 'monthlyCalibration',
            confidence: '需校准',
            plans: [
                { name: 'Standard', price: 99, monthly: 1980 },
                { name: 'Pro', price: 299, monthly: 5980 },
                { name: 'Max', price: 599, monthly: 11980 }
            ],
            note: '当前是积分制；请用控制台实测“每 1M Token 消耗积分”后再换算。'
        }
    ];

    const UNQUANTIFIED_SUBSCRIPTIONS = {
        copilot: 'GitHub AI Credits 没有公开稳定的 Token 换算，无法证明是否覆盖 20B。',
        kimi: '官方页面能抓到套餐价格和权益，但没有公开稳定的 Token 月容量，需结合控制台实测。',
        openai: 'OpenAI Docs 公布的是消息区间和相对倍数，不是 Token 月包；Pro 20x 仍有周限额。',
        grok: '套餐页正文可由浏览器渲染采集，但只公布相对用量等级，没有公开 Token 月容量。'
    };

    function weightedTokenFactor(model, outputRatio, cacheHitRatio) {
        const inputRatio = 1 - outputRatio;
        return inputRatio * (cacheHitRatio * model.cached + (1 - cacheHitRatio) * model.input)
            + outputRatio * model.output;
    }

    function planCapacityB(profile, plan, options) {
        if (profile.kind === 'coefficient') {
            const model = profile.models[options.modelTier];
            const factor = weightedTokenFactor(model, options.outputRatio, options.cacheHitRatio)
                * (1 - options.offPeakRatio * 0.5);
            const monthlyByWeek = plan.weekly * (30 / 7);
            const monthlyByFiveHour = plan.fiveHour * (24 / 5) * 30;
            const points = Math.min(monthlyByWeek, monthlyByFiveHour);
            return { capacityB: points * 10000 / factor / 1e9, modelLabel: model.label, bottleneck: monthlyByWeek <= monthlyByFiveHour ? '每周窗口' : '5小时窗口' };
        }
        if (profile.kind === 'credit') {
            const model = profile.models[options.modelTier];
            const factor = weightedTokenFactor(model, options.outputRatio, options.cacheHitRatio)
                * (1 - options.offPeakRatio * 0.2);
            return { capacityB: plan.monthly / factor / 1e9, modelLabel: model.label, bottleneck: '月度 Credits' };
        }
        if (profile.kind === 'requests') {
            const monthly = plan.monthly * options.tokensPerRequest;
            const weekly = plan.weekly ? plan.weekly * (30 / 7) * options.tokensPerRequest : Infinity;
            const fiveHour = plan.fiveHour ? plan.fiveHour * (24 / 5) * 30 * options.tokensPerRequest : Infinity;
            const capacityTokens = Math.min(monthly, weekly, fiveHour);
            const bottleneck = capacityTokens === monthly ? '每月请求数' : (capacityTokens === weekly ? '每周请求数' : '5小时请求数');
            return { capacityB: capacityTokens / 1e9, modelLabel: `平均 ${(options.tokensPerRequest / 1000).toFixed(0)}K Token/请求`, bottleneck };
        }
        if (profile.kind === 'weeklyCalibration') {
            if (!options.bailianCreditsPerM) return { capacityB: NaN, modelLabel: '等待实测校准', bottleneck: '动态 Credits' };
            return { capacityB: plan.weekly * (30 / 7) / options.bailianCreditsPerM / 1000, modelLabel: `${options.bailianCreditsPerM} Credits/1M`, bottleneck: '每7天 Credits' };
        }
        if (profile.kind === 'monthlyCalibration') {
            if (!options.tencentPointsPerM) return { capacityB: NaN, modelLabel: '等待实测校准', bottleneck: '动态积分' };
            return { capacityB: plan.monthly / options.tencentPointsPerM / 1000, modelLabel: `${options.tencentPointsPerM} 积分/1M`, bottleneck: '月度积分' };
        }
        return { capacityB: NaN, modelLabel: '不可换算', bottleneck: '未知' };
    }

    function chooseProviderPlan(profile, options) {
        const rows = profile.plans.map(plan => ({ ...plan, ...planCapacityB(profile, plan, options) }));
        const known = rows.filter(row => Number.isFinite(row.capacityB)).sort((a, b) => a.price - b.price);
        if (!known.length) return { profile, plan: rows[rows.length - 1], known: false };
        const full = known.find(row => row.capacityB >= options.targetB);
        const plan = full || [...known].sort((a, b) => b.capacityB - a.capacityB)[0];
        return { profile, plan, known: true };
    }

    function buildTwentyBFindings(options, results) {
        if (Math.abs(options.targetB - 20) > 0.01) return '';
        const byId = new Map(results.map(result => [result.profile.providerId, result]));
        const qianfan = byId.get('qianfan');
        const volcengine = byId.get('volcengine');
        const zhipu = byId.get('zhipu');
        const mimo = byId.get('mimo');
        const notes = [];
        if (qianfan && qianfan.known) notes.push(`百度 Pro 按当前平均请求约覆盖 ${(qianfan.plan.capacityB / 20 * 100).toFixed(0)}%`);
        if (volcengine && volcengine.known) notes.push(`火山 Pro 按当前平均请求约覆盖 ${(volcengine.plan.capacityB / 20 * 100).toFixed(0)}%`);
        if (zhipu && zhipu.known) notes.push(`智谱 ${escapeHtml(zhipu.plan.name)} 约覆盖 ${(zhipu.plan.capacityB / 20 * 100).toFixed(0)}%`);
        if (mimo && mimo.known) notes.push(`MiMo ${escapeHtml(mimo.plan.name)} 约覆盖 ${(mimo.plan.capacityB / 20 * 100).toFixed(0)}%`);
        if (!notes.length) return '';
        return `<div class="llm-highlight-promo" style="margin-top:8px;">20B 快照：${notes.join('；')}。若请求制套餐接近覆盖，优先实测单请求计费 Token；若仍有大缺口，通常需要“订阅主力 + API 兜底”或多套餐组合。</div>`;
    }

    function estimateApiCost(profile, totalTokensM, outputRatio, cacheHitRatio, offPeakRatio) {
        const outputM = totalTokensM * outputRatio;
        const inputM = Math.max(0, totalTokensM - outputM);
        const cachedInputM = inputM * cacheHitRatio;
        const uncachedInputM = inputM - cachedInputM;
        const peakCost = cachedInputM * profile.cachedInputPeak
            + uncachedInputM * profile.uncachedInputPeak
            + outputM * profile.outputPeak;
        const cost = peakCost * (1 - offPeakRatio * 0.5);
        return { cost, inputM, outputM, cachedInputM, uncachedInputM, peakCost };
    }

    function renderCalc() {
        bodyContent.innerHTML = `
            <div class="llm-calc-box">
                <div style="font-weight: 600; margin-bottom: 12px; font-size: 14px;">🏋️ 大用量订阅压力测试</div>
                <div class="llm-input-group"><span>月度目标 Token：</span><span><input type="number" id="calc-target-b" class="llm-input-num" value="20" min="0.1" max="1000" step="0.1" /> B</span></div>
                <div class="llm-input-group"><span>平均每次计费请求 Token：</span><span><input type="number" id="calc-request-k" class="llm-input-num" value="250" min="1" max="2000" step="1" /> K</span></div>
                <div class="llm-input-group"><span>模型档位：</span><select id="calc-model-tier" class="llm-input-num" style="width:170px; text-align:left;"><option value="economy">经济/Flash</option><option value="flagship">旗舰/Pro</option></select></div>
                <div class="llm-input-group"><span>输出 Token 占比：</span><span><input type="number" id="calc-output-ratio" class="llm-input-num" value="10" min="0" max="90" /> %</span></div>
                <div class="llm-input-group"><span>输入缓存命中率：</span><span><input type="number" id="calc-cache-hit" class="llm-input-num" value="95" min="0" max="100" /> %</span></div>
                <div class="llm-input-group"><span>闲时/夜间用量占比：</span><span><input type="number" id="calc-offpeak" class="llm-input-num" value="40" min="0" max="100" /> %</span></div>
                <details>
                    <summary class="llm-muted" style="cursor:pointer;">需要控制台实测才能换算的厂商</summary>
                    <div class="llm-input-group" style="margin-top:10px;"><span>百炼：每 1M Token 消耗 Credits</span><input type="number" id="calc-bailian-cal" class="llm-input-num" value="0" min="0" step="0.01" /></div>
                    <div class="llm-input-group"><span>腾讯：每 1M Token 消耗积分</span><input type="number" id="calc-tencent-cal" class="llm-input-num" value="0" min="0" step="0.01" /></div>
                </details>
                <div class="llm-muted">请求制套餐对平均单请求 Token 极度敏感；积分制按官方系数估算。结果是容量压力测试，不保证厂商允许持续以最大上下文消耗。</div>
            </div>
            <div id="llm-heavy-summary" class="llm-calc-box"></div>
            <div style="font-size:13px;font-weight:600;margin-bottom:8px;">订阅覆盖能力（优先完整覆盖，其次覆盖率）</div>
            <div id="llm-subscription-ranking"></div>
            <details class="llm-calc-box" style="margin-top:12px;">
                <summary style="cursor:pointer;font-weight:600;font-size:13px;">API 兜底成本</summary>
                <div class="llm-input-group" style="margin-top:10px;"><span>兜底模型：</span><select id="calc-profile" class="llm-input-num" style="width:190px;text-align:left;"><option value="deepseekFlash">DeepSeek V4.1 Flash</option><option value="deepseekPro">DeepSeek V4 Pro</option></select></div>
                <div id="llm-api-breakdown"></div>
            </details>
            <div id="llm-unquantified"></div>
        `;

        function update() {
            const targetB = Math.max(0.1, parseFloat(document.getElementById('calc-target-b').value) || 20);
            const tokensPerRequest = Math.max(1000, (parseFloat(document.getElementById('calc-request-k').value) || 250) * 1000);
            const outputRatio = Math.min(0.9, Math.max(0, (parseFloat(document.getElementById('calc-output-ratio').value) || 0) / 100));
            const cacheHitRatio = Math.min(1, Math.max(0, (parseFloat(document.getElementById('calc-cache-hit').value) || 0) / 100));
            const offPeakRatio = Math.min(1, Math.max(0, (parseFloat(document.getElementById('calc-offpeak').value) || 0) / 100));
            const options = {
                targetB, tokensPerRequest, outputRatio, cacheHitRatio, offPeakRatio,
                modelTier: document.getElementById('calc-model-tier').value,
                bailianCreditsPerM: Math.max(0, parseFloat(document.getElementById('calc-bailian-cal').value) || 0),
                tencentPointsPerM: Math.max(0, parseFloat(document.getElementById('calc-tencent-cal').value) || 0)
            };
            const enabledIds = new Set(getEnabledProviders().map(provider => provider.id));
            const apiProfile = API_COST_PROFILES[document.getElementById('calc-profile').value] || API_COST_PROFILES.deepseekFlash;
            const apiEstimate = estimateApiCost(apiProfile, targetB * 1000, outputRatio, cacheHitRatio, offPeakRatio);
            const apiCostPerB = apiEstimate.cost / targetB;
            const results = SUBSCRIPTION_PROFILES.filter(profile => enabledIds.has(profile.providerId)).map(profile => chooseProviderPlan(profile, options));
            results.forEach(result => {
                if (!result.known || !Number.isFinite(result.plan.capacityB)) { result.score = Infinity; return; }
                const missingB = Math.max(0, targetB - result.plan.capacityB);
                result.score = result.plan.price + missingB * apiCostPerB;
            });
            results.sort((a, b) => {
                const aFit = a.known && a.plan.capacityB >= targetB;
                const bFit = b.known && b.plan.capacityB >= targetB;
                if (aFit !== bFit) return aFit ? -1 : 1;
                if (aFit && bFit) return a.plan.price - b.plan.price;
                if (a.known !== b.known) return a.known ? -1 : 1;
                return a.score - b.score;
            });
            const requiredRequests = targetB * 1e9 / tokensPerRequest;
            document.getElementById('llm-heavy-summary').innerHTML = `
                <div style="font-weight:600;margin-bottom:6px;">目标 ${targetB.toFixed(2)}B Token/月 ≈ ${Math.ceil(requiredRequests).toLocaleString()} 次请求</div>
                <div class="llm-muted">假设平均 ${(tokensPerRequest / 1000).toFixed(0)}K Token/次、输出 ${(outputRatio * 100).toFixed(0)}%、缓存命中 ${(cacheHitRatio * 100).toFixed(0)}%、闲时 ${(offPeakRatio * 100).toFixed(0)}%。调整任一参数，排名会立即重算。</div>
                ${buildTwentyBFindings(options, results)}
            `;
            document.getElementById('llm-subscription-ranking').innerHTML = results.map((result, index) => {
                const plan = result.plan;
                if (!result.known || !Number.isFinite(plan.capacityB)) {
                    return `<div class="llm-rank-item"><div><strong style="color:#8b949e;">${escapeHtml(result.profile.provider)} · ${escapeHtml(plan.name)}</strong><div class="llm-muted">容量不可计算：${escapeHtml(result.profile.note)}</div></div><div style="text-align:right;">¥${plan.price}/月<br><span class="llm-muted">待校准</span></div></div>`;
                }
                const coverage = plan.capacityB / targetB;
                const fit = coverage >= 1;
                const missingB = Math.max(0, targetB - plan.capacityB);
                const hybridCost = plan.price + missingB * apiCostPerB;
                const color = fit ? '#3fb950' : (coverage >= 0.5 ? '#e3b341' : '#f85149');
                return `
                    <div class="llm-rank-item">
                        <div style="max-width:70%;">
                            <strong style="color:${color};">#${index + 1} ${escapeHtml(result.profile.provider)} · ${escapeHtml(plan.name)}</strong>
                            <div class="llm-muted">${escapeHtml(plan.modelLabel)} · 瓶颈：${escapeHtml(plan.bottleneck)} · 可信度：${escapeHtml(result.profile.confidence)}</div>
                            <div class="llm-muted">${escapeHtml(result.profile.note)}</div>
                            ${fit ? '' : `<div class="llm-muted">缺口 ${missingB.toFixed(2)}B；按当前 ${escapeHtml(apiProfile.label)} 兜底，混合成本约 ¥${hybridCost.toFixed(0)}/月</div>`}
                        </div>
                        <div style="text-align:right;"><strong>¥${plan.price}/月</strong><br><span style="color:${color};">约 ${plan.capacityB.toFixed(2)}B<br>${(coverage * 100).toFixed(0)}%</span></div>
                    </div>
                `;
            }).join('') || '<div class="llm-muted">没有启用可量化的订阅厂商。</div>';
            document.getElementById('llm-api-breakdown').innerHTML = `
                <div style="font-weight:600;margin-bottom:5px;">纯 API：${escapeHtml(apiProfile.label)} 约 ¥${apiEstimate.cost.toFixed(0)}/月</div>
                <div class="llm-muted">高峰基准 ¥${apiEstimate.peakCost.toFixed(0)}；折合约 ¥${apiCostPerB.toFixed(0)}/B。API 适合作为订阅额度耗尽后的兜底，不是本页首选排名。</div>
            `;
            const unknownRows = Object.entries(UNQUANTIFIED_SUBSCRIPTIONS).filter(([id]) => enabledIds.has(id));
            document.getElementById('llm-unquantified').innerHTML = unknownRows.length ? `
                <div class="llm-calc-box" style="margin-top:12px;"><div style="font-weight:600;margin-bottom:6px;">无法按 Token 证明覆盖能力</div>
                    ${unknownRows.map(([id, reason]) => { const provider = getEnabledProviders().find(item => item.id === id); return `<div class="llm-muted" style="margin-bottom:5px;"><strong>${escapeHtml(provider ? provider.name : id)}：</strong>${escapeHtml(reason)}</div>`; }).join('')}
                </div>
            ` : '';
        }

        ['calc-target-b', 'calc-request-k', 'calc-model-tier', 'calc-output-ratio', 'calc-cache-hit', 'calc-offpeak', 'calc-bailian-cal', 'calc-tencent-cal', 'calc-profile'].forEach(id => {
            document.getElementById(id).addEventListener('input', update);
            document.getElementById(id).addEventListener('change', update);
        });
        update();
    }

    // ======================== 5. 交互控制器 (拖拽、点击隔离与持久化) ========================
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

    modal.querySelector('#llm-btn-close').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // 5.1 悬浮球拖拽与点击判定 (区分 Drag 与 Click)
    let isFloaterDragging = false;
    let floaterMoved = false;
    let fStartX, fStartY, fInitLeft, fInitTop;

    floater.addEventListener('pointerdown', (e) => {
        isFloaterDragging = true;
        floaterMoved = false;
        fStartX = e.clientX;
        fStartY = e.clientY;

        const rect = floater.getBoundingClientRect();
        fInitLeft = rect.left;
        fInitTop = rect.top;

        // 统一为 left/top 控制，消除 right/bottom 干扰
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
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
            floaterMoved = true;
        }

        const clampX = Math.max(10, Math.min(window.innerWidth - floater.offsetWidth - 10, fInitLeft + dx));
        const clampY = Math.max(10, Math.min(window.innerHeight - floater.offsetHeight - 10, fInitTop + dy));
        floater.style.left = `${clampX}px`;
        floater.style.top = `${clampY}px`;
    }

    function onFloaterMouseUp(e) {
        if (!isFloaterDragging) return;
        isFloaterDragging = false;
        document.removeEventListener('pointermove', onFloaterMouseMove);
        document.removeEventListener('pointerup', onFloaterMouseUp);

        if (floaterMoved) {
            // 拖拽结束：保存当前坐标到本地持久存储
            const rect = floater.getBoundingClientRect();
            GM_setValue('llm_floater_pos', { left: rect.left, top: rect.top });
        } else {
            // 位移小于 4px，判定为点击：切换面板展示
            modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
        }
    }

    // 5.2 窗口头部拖拽
    const dragHeader = modal.querySelector('#llm-header-drag');
    let isModalDragging = false, mStartX, mStartY, mInitLeft, mInitTop;

    dragHeader.addEventListener('pointerdown', (e) => {
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
        if (floater.style.left) {
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