import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    buildSlotKey,
    documentsToSupersede,
    pickCurrentDocumentId,
    slotKeyEquals,
} from './document-store-slot.ts'

describe('pickCurrentDocumentId', () => {
    it('picks latest filed_at', () => {
        const current = pickCurrentDocumentId(
            [
                { document_id: 100, filed_at: '2024-03-01', is_current: true },
                { document_id: 200, filed_at: '2025-03-01', is_current: true },
            ],
            { document_id: 150, filed_at: '2024-06-01' }
        )
        assert.equal(current, 200)
    })

    it('prefers incoming when filed_at is newer', () => {
        const current = pickCurrentDocumentId(
            [{ document_id: 100, filed_at: '2024-03-01', is_current: true }],
            { document_id: 200, filed_at: '2025-03-01' }
        )
        assert.equal(current, 200)
    })
})

describe('documentsToSupersede', () => {
    it('marks older current rows for supersession', () => {
        const ids = documentsToSupersede(
            [
                { document_id: 100, filed_at: '2024-03-01', is_current: true },
                { document_id: 200, filed_at: '2025-03-01', is_current: true },
            ],
            200
        )
        assert.deepEqual(ids, [100])
    })
})

describe('buildSlotKey', () => {
    it('includes report_period for quarterly slots', () => {
        const q1 = buildSlotKey({
            stock_code: 'ALK',
            document_kind: 'quarterly_pl',
            fiscal_year: 2025,
            report_period: 'q1_pl',
        })
        const q3 = buildSlotKey({
            stock_code: 'ALK',
            document_kind: 'quarterly_pl',
            fiscal_year: 2025,
            report_period: 'q3_pl',
        })
        assert.equal(slotKeyEquals(q1, q3), false)
        assert.equal(q1.report_period, 'q1_pl')
    })
})
