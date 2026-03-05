import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execSync } from 'node:child_process'
import process from 'node:process'

// ─── Constants ───────────────────────────────────────────────────────

const GEM_ID = '8c99566ee291'

type ThinkingLevel = 'fast' | 'think' | 'pro'

// Thinking level → Gemini model header mapping
// These headers control which model Gemini uses server-side
// Note: values use escaped quotes for safe embedding in JS strings
const THINKING_MODEL_HEADERS: Record<ThinkingLevel, string> = {
    fast: '[1,null,null,null,\\\"fbb127bbb056c959\\\",null,null,0,[4],null,null,1]',
    think: '[1,null,null,null,\\\"5bf011840784117a\\\",null,null,0,[4],null,null,1]',
    pro: '[1,null,null,null,\\\"9d8ca3786ebdfbea\\\",null,null,0,[4],null,null,1]',
}

const THINKING_LABEL: Record<ThinkingLevel, string> = {
    fast: '快速 (Flash)',
    think: '思考 (Flash Thinking)',
    pro: 'Pro',
}

// ─── Args ────────────────────────────────────────────────────────────

type CliArgs = {
    videoUrl: string
    outputFile?: string
    thinkingLevel: ThinkingLevel
    help: boolean
}

function parseArgs(argv: string[]): CliArgs {
    const args: CliArgs = {
        videoUrl: '',
        thinkingLevel: 'think',
        help: false,
    }

    const positional: string[] = []

    for (let i = 0; i < argv.length; i++) {
        const a = argv[i]!
        if (a === '-h' || a === '--help') {
            args.help = true
            continue
        }
        if (a === '-o' || a === '--output') {
            args.outputFile = argv[++i]
            continue
        }
        if (a === '--thinking' || a === '--level') {
            const level = argv[++i]?.toLowerCase()
            if (level === 'fast' || level === 'think' || level === 'pro') {
                args.thinkingLevel = level
            } else {
                console.error(`Invalid thinking level: ${level}. Use fast, think, or pro.`)
                process.exit(1)
            }
            continue
        }
        if (a.startsWith('-')) {
            console.error(`Unknown option: ${a}`)
            process.exit(1)
        }
        positional.push(a)
    }

    if (!args.help) {
        args.videoUrl = positional.join(' ').trim()
        if (!args.videoUrl) {
            console.error('Error: YouTube URL is required.')
            process.exit(1)
        }
    }

    return args
}

function printUsage(): void {
    console.log(`Transcribe YouTube videos using Gemini Gem via Chrome AppleScript

Usage:
  npx -y bun transcribe.ts [options] <youtube-url>

Options:
  -o, --output <path>     Save transcript to file
  --thinking <level>      Thinking level: fast, think (default), pro
  -h, --help              Show this help

Thinking Levels:
  fast    → Gemini Flash (fastest, less detailed)
  think   → Gemini Flash Thinking (default, balanced)
  pro     → Gemini Pro (most detailed, slower)

Prerequisites:
  - Google Chrome running with gemini.google.com logged in
  - Chrome > View > Developer > "Allow JavaScript from Apple Events" enabled

Examples:
  npx -y bun transcribe.ts https://www.youtube.com/watch?v=xxx
  npx -y bun transcribe.ts -o transcript.md https://youtu.be/xxx
  npx -y bun transcribe.ts --thinking pro https://www.youtube.com/watch?v=xxx
`)
}

// ─── Chrome AppleScript Execution ────────────────────────────────────

function executeInChrome(jsCode: string): string {
    // Write JS to temp file, then build AppleScript that reads and executes it
    // This avoids all escaping issues with inline code
    const tmpJs = path.join(os.tmpdir(), `gemini-transcribe-${Date.now()}.js`)
    fs.writeFileSync(tmpJs, jsCode, 'utf-8')

    // AppleScript reads JS from file, escapes it for execute javascript, then runs it
    const tmpScpt = path.join(os.tmpdir(), `gemini-transcribe-${Date.now()}.applescript`)
    const appleScript = `
set jsFile to POSIX file "${tmpJs}"
set jsCode to read jsFile as «class utf8»

tell application "Google Chrome"
    set targetTab to missing value
    repeat with w in windows
        repeat with t in tabs of w
            if URL of t contains "gemini.google.com" then
                set targetTab to t
                exit repeat
            end if
        end repeat
        if targetTab is not missing value then exit repeat
    end repeat

    if targetTab is missing value then
        tell window 1
            set newTab to make new tab with properties {URL:"https://gemini.google.com/app"}
            delay 5
            set targetTab to newTab
        end tell
    end if

    with timeout of 300 seconds
        set r to execute targetTab javascript jsCode
    end timeout
    return r
end tell
`
    fs.writeFileSync(tmpScpt, appleScript, 'utf-8')

    try {
        const result = execSync(`osascript "${tmpScpt}"`, {
            encoding: 'utf-8',
            timeout: 300_000,
            maxBuffer: 50 * 1024 * 1024,
        })
        return result.trim()
    } catch (e: any) {
        if (e.stderr?.includes('Apple 事件中的 JavaScript')) {
            throw new Error(
                'Chrome 未开启 AppleScript JavaScript。请开启：Chrome > 查看 > 开发者 > 允许 Apple 事件中的 JavaScript',
            )
        }
        throw new Error(`AppleScript execution failed: ${e.stderr || e.message}`)
    } finally {
        try { fs.unlinkSync(tmpJs) } catch { }
        try { fs.unlinkSync(tmpScpt) } catch { }
    }
}

// ─── Gemini API via Chrome ───────────────────────────────────────────

function escapeForJs(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function buildApiCallJs(videoUrl: string, modelHeader: string): string {
    const safeUrl = escapeForJs(videoUrl)
    const safeGemId = escapeForJs(GEM_ID)
    return `(function() { try { var scripts = document.querySelectorAll("script"); var token = null; for (var i = 0; i < scripts.length; i++) { var m = scripts[i].textContent.match(/"SNlM0e":"([^"]+)"/); if (m) { token = m[1]; break; } } if (!token) return "ERR:no_token"; var xhr = new XMLHttpRequest(); xhr.open("POST", "https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate", false); xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=utf-8"); xhr.setRequestHeader("X-Same-Domain", "1"); xhr.setRequestHeader("x-goog-ext-525001261-jspb", "${modelHeader}"); xhr.withCredentials = true; var gemId = "${safeGemId}"; var prompt = "${safeUrl}"; var inner = [[prompt], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, gemId]; var fReq = JSON.stringify([null, JSON.stringify(inner)]); var body = "at=" + encodeURIComponent(token) + "&f.req=" + encodeURIComponent(fReq); xhr.send(body); if (xhr.status !== 200) return "ERR:status_" + xhr.status; var text = xhr.responseText; var lines = text.split(String.fromCharCode(10)); for (var i = 0; i < lines.length; i++) { var line = lines[i].trim(); if (line.length < 10) continue; try { var parsed = JSON.parse(line); if (!Array.isArray(parsed)) continue; for (var j = 0; j < parsed.length; j++) { if (!Array.isArray(parsed[j]) || parsed[j].length < 3 || typeof parsed[j][2] !== "string") continue; var bodyJson = JSON.parse(parsed[j][2]); if (bodyJson && Array.isArray(bodyJson[4]) && bodyJson[4].length > 0 && Array.isArray(bodyJson[4][0])) { var c = bodyJson[4][0]; if (c[1] && Array.isArray(c[1]) && typeof c[1][0] === "string" && c[1][0].length > 50) return c[1][0]; } } } catch(e2) {} } return "ERR:parse_failed"; } catch(e) { return "ERR:" + e.message; } })()`
}

// ─── Main ────────────────────────────────────────────────────────────

function main(): void {
    const args = parseArgs(process.argv.slice(2))

    if (args.help) {
        printUsage()
        return
    }

    if (process.platform !== 'darwin') {
        console.error('Error: This script requires macOS with Chrome and AppleScript support.')
        process.exit(1)
    }

    const modelHeader = THINKING_MODEL_HEADERS[args.thinkingLevel]
    console.error(`[transcribe] Video: ${args.videoUrl}`)
    console.error(`[transcribe] Thinking: ${THINKING_LABEL[args.thinkingLevel]}`)

    // Build and execute the API call via Chrome
    console.error('[transcribe] Sending to Gemini via Chrome...')
    const jsCode = buildApiCallJs(args.videoUrl, modelHeader)
    const result = executeInChrome(jsCode)

    // Check for errors
    if (result === 'missing value' || !result) {
        console.error('Error: No response from Gemini. Make sure you are logged into gemini.google.com in Chrome.')
        process.exit(1)
    }
    if (result.startsWith('ERR:no_token')) {
        console.error('Error: Could not extract access token. Please refresh the gemini.google.com page in Chrome and try again.')
        process.exit(1)
    }
    if (result.startsWith('ERR:status_')) {
        console.error(`Error: Gemini API returned ${result}. Please try again.`)
        process.exit(1)
    }
    if (result.startsWith('ERR:')) {
        console.error(`Error: ${result}`)
        process.exit(1)
    }

    // Clean up trailing googleusercontent URL if present
    const transcript = result.replace(/\n*http:\/\/googleusercontent\.com\/youtube_content\/\d+\s*$/, '').trimEnd()

    console.error(`[transcribe] Done (${transcript.length} chars)`)

    // Output
    if (args.outputFile) {
        const dir = path.dirname(args.outputFile)
        if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(args.outputFile, transcript, 'utf-8')
        console.error(`[transcribe] Saved to: ${args.outputFile}`)
    } else {
        console.log(transcript)
    }
}

main()
