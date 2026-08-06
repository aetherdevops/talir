import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeWatchlists } from './watchlist.ts'

describe('normalizeWatchlists', () => {
    it('seeds a default list when the snapshot is empty', () => {
        const state = normalizeWatchlists([], null)
        assert.equal(state.watchlists.length, 1)
        assert.equal(state.watchlists[0]?.id, 'default')
        assert.equal(state.activeListId, 'default')
        assert.deepEqual(state.watchlists[0]?.items, [])
    })

    it('keeps provided lists and falls back active id to the first list', () => {
        const state = normalizeWatchlists(
            [
                {
                    id: 'a',
                    name: 'A',
                    items: [{ code: 'KMB', addedAt: '2026-01-01T00:00:00.000Z' }],
                    createdAt: '2026-01-01T00:00:00.000Z',
                },
            ],
            'missing'
        )
        assert.equal(state.watchlists.length, 1)
        assert.equal(state.activeListId, 'a')
    })
})
