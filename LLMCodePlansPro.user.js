// ==UserScript==
// @name         大模型代码订阅对比与更新雷达 (LLM CodePlans Pro)
// @namespace    https://github.com/impace/llm-codingplans
// @version      2.5.0
// @description  大模型代码订阅对比、动态更新追踪与月用量自适应成本测算工具（支持可拖拽悬浮球与样式隔离）
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
    const APP_VERSION = '2.5.0';
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
                updates: Array.isArray(s.links?.updates) ? s.links.updates : []
            }
        };
    }

    function mergeProviderLinks(provider, savedProvider) {
        provider = normalizeProvider(provider);
        const savedLinks = savedProvider?.links || {};
        const links = {
            pricing: provider.links.pricing.map(l => ({ ...l })),
            updates: provider.links.updates.map(l => ({ ...l }))
        };
        ['pricing', 'updates'].forEach(type => {
            if (!Array.isArray(savedLinks[type])) return;
            const custom = savedLinks[type]
                .filter(l => l && isHttpUrl(l.url))
                .map(l => ({ title: String(l.title || '自定义来源').trim(), url: l.url.trim() }));
            if (custom.length) links[type] = custom;
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
                    selectors: ['div[class*="contentdoc-"]', 'div[class*="content-CK"]', 'main', 'article'],
                    minLength: 120,
                    markers: []
                };
            }
            if (parsed.hostname === 'docs.bigmodel.cn') {
                return {
                    mode: 'rendered',
                    extractorId: 'zhipu-coding-plan',
                    selectors: ['main', 'article', '[class*="markdown"]', 'body'],
                    minLength: 200,
                    markers: []
                };
            }
            if (parsed.hostname === 'www.kimi.com' && /^\/code\/?$/.test(parsed.pathname)) {
                return {
                    mode: 'rendered',
                    extractorId: 'kimi-code-pricing',
                    selectors: ['.kfc-pricing-content', 'main', 'body'],
                    minLength: 120,
                    markers: []
                };
            }
            if (parsed.hostname === 'grok.com' && parsed.pathname.startsWith('/plans')) {
                return {
                    mode: 'rendered',
                    extractorId: 'grok-plans',
                    selectors: ['main', 'body'],
                    minLength: 180,
                    markers: []
                };
            }
        } catch {
            return { mode: 'normal' };
        }
        return { mode: 'normal' };
    }

    function requestUpdateCheck(url, previous, requestOptions = {}) {
        return new Promise(resolve => {
            if (!isHttpUrl(url)) {
                resolve({ ok: false, status: 0, error: '非有效 URL' });
                return;
            }
            const headers = { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' };
            if (previous?.etag) headers['If-None-Match'] = previous.etag;
            if (previous?.lastModified) headers['If-Modified-Since'] = previous.lastModified;

            GM_xmlhttpRequest({
                method: 'GET',
                url,
                timeout: 12000,
                anonymous: true,
                headers,
                onload: res => {
                    const raw = String(res.responseText || '');
                    const title = (raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
                    const body = sanitizeProbeText(normalizeProbeText(raw));
                    const status = Number(res.status) || 0;
                    if (status === 304) {
                        resolve({
                            ok: true, status, statusText: res.statusText || '',
                            fingerprint: previous?.fingerprint || '',
                            etag: previous?.etag || '', lastModified: previous?.lastModified || '',
                            title: previous?.title || '', bytes: 0, textLength: previous?.textLength || 0,
                            checkedAt: new Date().toISOString(), changed: false, notModified: true, error: ''
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
                        checkedAt: new Date().toISOString(),
                        error: status >= 200 && status < 400 ? '' : `HTTP ${status}`
                    });
                },
                onerror: () => resolve({ ok: false, status: 0, error: '网络错误或拒绝连接' }),
                ontimeout: () => resolve({ ok: false, status: 0, error: '请求超时（12秒）' })
            });
        });
    }

    function extractRenderedText(rule) {
        const selectors = rule.selectors?.length ? rule.selectors : ['main', 'article', '[role="main"]', 'body'];
        const candidates = [];
        selectors.forEach(sel => {
            try {
                document.querySelectorAll(sel).forEach(node => {
                    const t = String(node.innerText || node.textContent || '').trim();
                    if (t) candidates.push(t);
                });
            } catch {}
        });
        const longest = candidates.sort((a, b) => b.length - a.length)[0] || '';
        return sanitizeProbeText(longest).slice(0, MAX_PROBE_BYTES);
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
            const timedOut = Date.now() - startedAt > 22000;

            if ((!enough || stableRounds < 2) && !timedOut) {
                setTimeout(collect, 500);
                return;
            }
            GM_setValue(reqKey, {
                state: 'done',
                ok: enough,
                error: enough ? '' : (blocked ? '命中安全验证' : '有效正文不足 ' + minLength + ' 字'),
                checkedAt: new Date().toISOString(),
                title: document.title,
                textLength: text.length,
                fingerprint: text ? hashText(text) : ''
            });
            setTimeout(() => window.close(), 300);
        };
        setTimeout(collect, 700);
    }

    function requestRenderedSource(url, previous, rule) {
        return new Promise(resolve => {
            const id = hashText(url);
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
                        weak: !res.ok,
                        changed: Boolean(res.ok && previous?.fingerprint && previous.fingerprint !== res.fingerprint),
                        previousCheckedAt: previous?.checkedAt || ''
                    });
                    return;
                }
                if (Date.now() - startedAt > 26000) {
                    if (tab && typeof tab.close === 'function') tab.close();
                    resolve({ ok: false, rendered: true, error: '采集超时（26秒）' });
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
        let result = rule.mode === 'rendered'
            ? await requestRenderedSource(url, previous, rule)
            : await requestUpdateCheck(url, previous, requestOptions);

        if (rule.mode !== 'rendered' && (!result.ok || result.weak) && typeof GM_openInTab === 'function') {
            const renderedRule = { ...rule, mode: 'rendered', minLength: 120 };
            const fallbackRes = await requestRenderedSource(url, previous, renderedRule);
            if (fallbackRes.ok) result = fallbackRes;
        }

        result.probeMode = rule.mode;
        if (result.ok) {
            result.changed = Boolean(previous?.fingerprint && previous.fingerprint !== result.fingerprint);
            result.previousCheckedAt = previous?.checkedAt || '';
            GM_setValue(sourceKey(url), result);
            return result;
        }
        const retained = previous ? { ...previous } : {};
        retained.lastError = result.error || '检查失败';
        retained.lastAttemptAt = new Date().toISOString();
        GM_setValue(sourceKey(url), retained);
        return { ...retained, attemptFailed: true, attemptError: retained.lastError };
    }

    function probeSummary(probe) {
        if (probe?.attemptFailed && probe.ok) {
            return { label: `本次失败：${probe.attemptError}；保留 ${formatDate(probe.checkedAt)} 记录`, color: '#e3b341' };
        }
        if (!probe) return { label: '未检查', color: '#8b949e' };
        if (!probe.ok) return { label: `失败：${probe.error || '未知错误'}`, color: '#f85149' };
        if (probe.changed) return { label: `页面发生更新（${formatDate(probe.checkedAt)}）`, color: '#e3b341' };
        if (probe.weak) return { label: `内容过短（${formatDate(probe.checkedAt)}）`, color: '#e3b341' };
        const len = Number(probe.textLength || probe.bytes || 0).toLocaleString();
        return { label: `正常 · ${len} 字（${formatDate(probe.checkedAt)}）`, color: '#3fb950' };
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
            transition: box-shadow 0.2s ease, transform 0.1s ease;
        }
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
        #llm-modal .llm-settings-label { display: block; margin-top: 8px; color: var(--llm-text-dim); font-size: 11px; }
        #llm-modal .llm-source-status { font-size: 11px; margin-top: 5px; line-height: 1.4; }
        #llm-modal .llm-muted { color: var(--llm-text-dim); font-size: 11px; line-height: 1.5; }
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
            const updateLinks = getUsableLinks(p, 'updates');
            const kw = [p.name, p.models, p.category, p.tag, p.plans, p.promos, p.traps].join(' ');
            html += `
                <div class="llm-card" data-kw="${escapeHtml(kw)}">
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
                    <div style="font-size: 11px; color: var(--llm-red); margin-bottom: 6px;">⚠️ <strong>避坑提示：</strong>${escapeHtml(p.traps)}</div>
                    <div class="llm-muted">官方数据核验：${escapeHtml(p.verifiedAt)}</div>
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
            <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
                <button class="llm-btn" id="llm-probe-all" title="依次联网检查全部启用的来源">检查全部来源</button>
                <button class="llm-btn" id="llm-probe-pricing" title="仅检查套餐和价格来源">仅检查定价</button>
                <button class="llm-btn" id="llm-radar-refresh" title="重新加载本地缓存状态">重新读取本地状态</button>
            </div>
            <div class="llm-muted" style="margin-bottom: 10px;">后台页面串行提取。绿色=正常；黄色=检测到变更；红色=请求失败。</div>
        `;
        providers.forEach(p => {
            [...getUsableLinks(p, 'pricing').map(l => ({ ...l, kind: 'pricing' })), ...getUsableLinks(p, 'updates').map(l => ({ ...l, kind: 'updates' }))].forEach(up => {
                const key = `llm_view_${p.id}_${encodeURIComponent(up.title)}`;
                const last = GM_getValue(key, '未读');
                const summary = probeSummary(GM_getValue(sourceKey(up.url), null));
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
            const status = card?.querySelector('[data-source-status]');
            button.disabled = true;
            if (status) { status.textContent = '来源检查：检查中…'; status.style.color = '#e3b341'; }
            const result = await probeSource(url);
            const next = probeSummary(result);
            if (status) { status.textContent = `来源检查：${next.label}`; status.style.color = next.color; }
            button.disabled = false;
        };

        bodyContent.querySelectorAll('.llm-probe-one').forEach(btn => {
            btn.addEventListener('click', () => checkOne(btn));
        });

        const sleep = ms => new Promise(r => setTimeout(r, ms));

        bodyContent.querySelector('#llm-probe-all').addEventListener('click', async e => {
            e.currentTarget.disabled = true;
            for (const btn of bodyContent.querySelectorAll('.llm-probe-one')) {
                await checkOne(btn);
                await sleep(350);
            }
            e.currentTarget.disabled = false;
        });

        bodyContent.querySelector('#llm-probe-pricing').addEventListener('click', async e => {
            e.currentTarget.disabled = true;
            for (const btn of bodyContent.querySelectorAll('.llm-probe-one[data-kind="pricing"]')) {
                await checkOne(btn);
                await sleep(350);
            }
            e.currentTarget.disabled = false;
        });

        bodyContent.querySelector('#llm-radar-refresh').addEventListener('click', renderRadar);
    }

    // ======================== 6. 月用量自适应测算引擎 (核心重构) ========================
    function renderCalc() {
        bodyContent.innerHTML = `
            <div class="llm-calc-box">
                <div style="font-weight: 600; margin-bottom: 12px; font-size: 14px;">🧮 月度代码用量 · 真实支出成本测算</div>
                <div class="llm-input-group">
                    <span>你的预估月度总 Token 消耗：</span>
                    <span><input type="number" id="calc-monthly-tokens-m" class="llm-input-num" value="200" min="1" max="100000" /> M Tokens</span>
                </div>
                <div class="llm-input-group">
                    <span>夜间 / 闲时任务占比 (可直接输入 0~100)：</span>
                    <span><input type="number" id="calc-night-ratio-input" class="llm-input-num" value="40" min="0" max="100" /> %</span>
                </div>
                <div class="llm-muted" style="margin-top:6px;">
                    💡 算法说明：输入你真实的月度 Token 规模。若套餐配额足够，按套餐原价计费；若因周限额或 5h 窗口导致额度不足，算法自动按 <strong>[套餐费 + 缺口 Token × DeepSeek API 单价]</strong> 测算真实月花费，并提示短板。
                </div>
            </div>
            <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">🏆 满足该用量的真实月支出排行（花费越低越合算）：</div>
            <div id="llm-calc-results"></div>
        `;

        function recalculate() {
            const targetM = Math.max(1, parseFloat(document.getElementById('calc-monthly-tokens-m').value) || 200);
            const nightPercent = Math.min(100, Math.max(0, parseFloat(document.getElementById('calc-night-ratio-input').value) || 0));
            const nightRatio = nightPercent / 100;

            // 统一 API 兜底基准（按 DeepSeek V4.1 Flash 混合算力折合单价：输入缓存0.04，未命中2.0，输出4.0，闲时半价）
            const dsUnitPricePerM = (0.04 * 0.8 + 2.0 * 0.2 + 4.0 * 0.1) * (1 - nightRatio * 0.5);

            // 各家套餐全月安全容量推导（单位：M Tokens）
            const plans = [
                {
                    name: 'DeepSeek 原生 API',
                    tier: '按量实时计费',
                    basePrice: 0,
                    maxCapacityM: 9999999, // 无上限
                    bottleneck: '随用随扣，无月度闲置浪费',
                    calcCost: (m) => m * dsUnitPricePerM
                },
                {
                    name: '火山方舟 (Coding Plan)',
                    tier: targetM <= 450 ? 'Lite 档位 (¥40/月)' : 'Pro 档位 (¥200/月)',
                    basePrice: targetM <= 450 ? 40 : 200,
                    // Lite 每月 18,000 次，按平均每次交互 25k Tokens 折合约 450M；Pro 9万次折约 2,250M
                    maxCapacityM: targetM <= 450 ? 450 : 2250,
                    bottleneck: targetM <= 450 ? '每月 18,000 次调用上限' : '每月 90,000 次调用上限'
                },
                {
                    name: '百度千帆 (Coding Plan)',
                    tier: targetM <= 450 ? 'Lite 档位 (¥40/月)' : 'Pro 档位 (¥200/月)',
                    basePrice: targetM <= 450 ? 40 : 200,
                    maxCapacityM: targetM <= 450 ? 450 : 2250,
                    bottleneck: targetM <= 450 ? '每月 18,000 次硬限额' : '每月 90,000 次硬限额'
                },
                {
                    name: '阿里百炼 (Token Plan)',
                    tier: targetM <= 180 ? 'Lite 档位 (¥39/月)' : (targetM <= 700 ? 'Standard 档位 (¥139/月)' : 'Pro 档位 (¥499/月)'),
                    basePrice: targetM <= 180 ? 39 : (targetM <= 700 ? 139 : 499),
                    // 每周 Credits，夜间享超低 2 折抵扣
                    maxCapacityM: (targetM <= 180 ? 180 : (targetM <= 700 ? 700 : 2800)) * (1 + nightRatio * 1.2),
                    bottleneck: '每 7 天 Credits 硬顶与 5h 滑动节流'
                },
                {
                    name: '小米 MiMo (Token Plan)',
                    tier: targetM <= 800 ? 'Lite 档位 (¥39/月)' : (targetM <= 2200 ? 'Standard 档位 (¥99/月)' : 'Pro 档位 (¥329/月)'),
                    basePrice: targetM <= 800 ? 39 : (targetM <= 2200 ? 99 : 329),
                    // 4.1B / 11B Credits, 夜间0.8倍
                    maxCapacityM: (targetM <= 800 ? 800 : (targetM <= 2200 ? 2200 : 7600)) * (1 + nightRatio * 0.25),
                    bottleneck: '月度固定 Credits 算力包总量'
                },
                {
                    name: 'GitHub Copilot Pro',
                    tier: 'Pro ($10/月 约¥72)',
                    basePrice: 72,
                    maxCapacityM: 300, // 补全无限，Agent 模式折合基础额度
                    bottleneck: '高级 Agent 模式依赖每月赠送额度'
                },
                {
                    name: '智谱 AI (Coding Plan)',
                    tier: targetM <= 350 ? 'Lite 档位 (¥118/月)' : 'Pro 档位 (¥538/月)',
                    basePrice: targetM <= 350 ? 118 : 538,
                    // 每周 1万 / 6万 积分硬顶，非高峰 5 折
                    maxCapacityM: (targetM <= 350 ? 350 : 2100) * (1 + nightRatio * 0.5),
                    bottleneck: '每 7 天积分硬顶，突击编码易提前用尽'
                }
            ];

            const results = plans.map(p => {
                if (p.calcCost) {
                    const cost = p.calcCost(targetM);
                    return {
                        ...p,
                        totalCost: cost,
                        coverage: 1.0,
                        missingM: 0,
                        desc: '随用随扣，100% 刚好满足'
                    };
                }
                const cap = p.maxCapacityM;
                if (cap >= targetM) {
                    // 套餐完全够用
                    return {
                        ...p,
                        totalCost: p.basePrice,
                        coverage: 1.0,
                        missingM: 0,
                        desc: `套餐容量约 ${cap.toFixed(0)}M（完全覆盖）`
                    };
                }
                // 套餐不够用：基础价 + 缺口按 API 补足
                const missing = targetM - cap;
                const extraCost = missing * dsUnitPricePerM;
                const total = p.basePrice + extraCost;
                return {
                    ...p,
                    totalCost: total,
                    coverage: cap / targetM,
                    missingM: missing,
                    desc: `套餐抗 ${cap.toFixed(0)}M，缺口 ${missing.toFixed(0)}M 需补 API 约 ¥${extraCost.toFixed(0)}`
                };
            });

            // 按真实总支出升序排序
            results.sort((a, b) => a.totalCost - b.totalCost);

            document.getElementById('llm-calc-results').innerHTML = results.map((item, idx) => `
                <div class="llm-rank-item">
                    <div style="max-width: 72%;">
                        <div>
                            <strong style="color: ${idx === 0 ? '#3fb950' : '#58a6ff'};">#${idx + 1} ${escapeHtml(item.name)}</strong>
                            <span class="llm-muted" style="margin-left: 6px;">[${escapeHtml(item.tier)}]</span>
                        </div>
                        <div class="llm-muted" style="margin-top:3px;">
                            ${escapeHtml(item.desc)}
                        </div>
                        <div class="llm-muted" style="font-size:10px; color:#8b949e;">
                            约束短板：${escapeHtml(item.bottleneck)}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <strong style="color: ${item.missingM === 0 ? '#3fb950' : '#e3b341'}; font-size:14px;">
                            约 ¥${item.totalCost.toFixed(0)} / 月
                        </strong>
                        <div class="llm-muted" style="font-size:11px;">
                            覆盖率 ${(item.coverage * 100).toFixed(0)}%
                        </div>
                    </div>
                </div>
            `).join('');
        }

        document.getElementById('calc-monthly-tokens-m').addEventListener('input', recalculate);
        document.getElementById('calc-night-ratio-input').addEventListener('input', recalculate);
        recalculate();
    }

    function renderSettings() {
        const providers = getAllProviders();
        let html = `
            <div class="llm-muted" style="margin-bottom: 12px;">
                配置保存于本地油猴沙箱。取消勾选可将厂商移出面板；修改地址即覆盖本地设置。每行格式：标题 | URL
            </div>
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                <button class="llm-btn" id="llm-save-settings">保存全部配置</button>
                <button class="llm-btn" id="llm-reset-settings">恢复初始默认</button>
            </div>
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
                    </div>
                    <label class="llm-settings-label">定价/套餐地址</label>
                    <textarea data-links="pricing">${escapeHtml(pricing.map(l => `${l.title} \vert{}${l.url}`).join('\n'))}</textarea>
                    <label class="llm-settings-label">更新/公告地址</label>
                    <textarea data-links="updates">${escapeHtml(updates.map(l => `${l.title} \vert{}${l.url}`).join('\n'))}</textarea>
                </div>
            `;
        });
        bodyContent.innerHTML = html;

        bodyContent.querySelector('#llm-save-settings').addEventListener('click', () => {
            const settings = readProviderSettings();
            bodyContent.querySelectorAll('[data-provider-settings]').forEach(row => {
                const id = row.getAttribute('data-provider-settings');
                settings[id] = {
                    ...(settings[id] || {}),
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

    modal.querySelector('#llm-btn-close').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    let isFloaterDragging = false, floaterMoved = false;
    let fStartX, fStartY, fInitLeft, fInitTop;

    floater.addEventListener('pointerdown', (e) => {
        isFloaterDragging = true;
        floaterMoved = false;
        fStartX = e.clientX;
        fStartY = e.clientY;

        const rect = floater.getBoundingClientRect();
        fInitLeft = rect.left;
        fInitTop = rect.top;

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
            GM_setValue('llm_floater_pos', { left: rect.left, top: rect.top });
        } else {
            modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
        }
    }

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