import { describe, expect, it, vi } from 'vitest'
import { createCardCache, fitFontSize, shareOrDownload, wrapWords, type ShareEnv } from './card'

const blob = new Blob(['x'], { type: 'image/png' })

describe('shareOrDownload', () => {
  it('uses Web Share with the file when supported', async () => {
    const env: ShareEnv = { canShare: () => true, share: vi.fn(async () => {}), download: vi.fn() }
    await expect(shareOrDownload(blob, env)).resolves.toBe('shared')
    const arg = (env.share as ReturnType<typeof vi.fn>).mock.calls[0][0] as ShareData
    expect(arg.files?.[0].name).toBe('umporcento.png')
    expect(env.download).not.toHaveBeenCalled()
  })

  it('is silent when the user cancels', async () => {
    const abort = Object.assign(new Error('cancel'), { name: 'AbortError' })
    const env: ShareEnv = { canShare: () => true, share: vi.fn(async () => { throw abort }), download: vi.fn() }
    await expect(shareOrDownload(blob, env)).resolves.toBe('cancelled')
    expect(env.download).not.toHaveBeenCalled()
  })

  it('falls back to download when sharing files is not supported', async () => {
    const env: ShareEnv = { canShare: () => false, share: vi.fn(), download: vi.fn() }
    await expect(shareOrDownload(blob, env)).resolves.toBe('downloaded')
    expect(env.download).toHaveBeenCalledWith(blob, 'umporcento.png')
  })

  it('falls back to download when Web Share is absent', async () => {
    const env: ShareEnv = { download: vi.fn() }
    await expect(shareOrDownload(blob, env)).resolves.toBe('downloaded')
  })

  it('falls back to download when share fails for another reason', async () => {
    const env: ShareEnv = { canShare: () => true, share: vi.fn(async () => { throw new Error('NotAllowed') }), download: vi.fn() }
    await expect(shareOrDownload(blob, env)).resolves.toBe('downloaded')
  })
})

describe('wrapWords', () => {
  const measure = (s: string) => s.length * 10
  it('wraps to max width', () => {
    expect(wrapWords('você ganha mais que', measure, 100)).toEqual(['você ganha', 'mais que'])
  })
  it('keeps a single long word on its own line', () => {
    expect(wrapWords('extraordinariamente', measure, 50)).toEqual(['extraordinariamente'])
  })
})

describe('createCardCache', () => {
  it('renders once so the share click does not wait for drawing', async () => {
    const render = vi.fn(async () => new Blob(['card']))
    const cache = createCardCache(render)
    const a = cache.get()
    expect(cache.get()).toBe(a)
    await a
    expect(render).toHaveBeenCalledTimes(1)
  })
  it('retries after a failed render', async () => {
    let calls = 0
    const cache = createCardCache(async () => {
      calls++
      if (calls === 1) throw new Error('boom')
      return new Blob(['ok'])
    })
    await expect(cache.get()).rejects.toThrow('boom')
    await expect(cache.get()).resolves.toBeInstanceOf(Blob)
  })
})

describe('fitFontSize', () => {
  const measure = (size: number) => size * 3 // text 3x wider than its size
  it('keeps the max size when the text fits', () => {
    expect(fitFontSize(measure, 100, 400)).toBe(100)
  })
  it('shrinks until the text fits', () => {
    expect(fitFontSize(measure, 400, 900)).toBe(300)
  })
  it('never goes below the minimum', () => {
    expect(fitFontSize(measure, 400, 30, 40)).toBe(40)
  })
})
